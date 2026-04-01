import { DBStore, FerretNode, FerretContract, FerretDependency } from '../store/types.js';

export interface ReconcileReport {
  consistent: boolean;
  flagged: Array<{
    nodeId: string;
    filePath: string;
    triggeredByContractId: string;
    impact: 'direct' | 'transitive';
    depth: number;
  }>;
  timestamp: string;
}

/**
 * The Reconciler engine (Phase 3).
 * It calculates the downstream impact of graph shape changes. Since resolving recursive graphs
 * can be heavily database dependent, we execute an Application-level Breadth-First Search (BFS)
 * to maintain 100% parity across SQLite and PostgreSQL effortlessly and stay extremely fast.
 */
export class Reconciler {
  constructor(private store: DBStore) {}

  /**
   * Identifies completely unhandled ripples and propagates them up to 10 hops (S011)
   */
  async reconcile(): Promise<ReconcileReport> {
    const nodes = await this.store.getNodes();
    const contracts = await this.store.getContracts();
    const dependencies = await this.store.getDependencies();

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const contractMap = new Map(contracts.map(c => [c.id, c]));

    // 1. Identify "changed/trigger" contracts. 
    // In our simplified engine approach, any contract attached to a Node that is "needs-review" 
    // acts as a signal for propagation, OR any specifically updated shapes.
    // For this prototype implementation, we'll traverse starting from specifically flagged nodes.
    const triggerContracts = contracts.filter(c => {
      const parentNode = nodeMap.get(c.node_id);
      return parentNode && parentNode.status === 'needs-review';
    });

    const flaggedNodes: ReconcileReport['flagged'] = [];
    
    // BFS Queue: [contractId, depth]
    // S011 explicitly mandates capping transitive impact at 10 hops.
    const queue: Array<[string, number]> = triggerContracts.map(c => [c.id, 1]);
    const visitedContracts = new Set<string>();

    while (queue.length > 0) {
      const [contractId, depth] = queue.shift()!;
      if (visitedContracts.has(contractId) || depth > 10) continue;
      visitedContracts.add(contractId);

      // Find nodes that import this contract
      const dependentEdges = dependencies.filter(d => d.target_contract_id === contractId);
      
      for (const edge of dependentEdges) {
        const dependentNodeId = edge.source_node_id;
        const dependentNode = nodeMap.get(dependentNodeId);

        if (!dependentNode) continue;

        // Skip nodes that are already reviewing or roadmap, per S011 instructions.
        if (dependentNode.status === 'needs-review' || dependentNode.status === 'roadmap') {
          continue;
        }

        // Flag the node natively
        await this.store.updateNodeStatus(dependentNode.id, 'needs-review');
        dependentNode.status = 'needs-review'; // Update internal ref mapping

        flaggedNodes.push({
          nodeId: dependentNode.id,
          filePath: dependentNode.file_path,
          triggeredByContractId: contractId,
          impact: depth === 1 ? 'direct' : 'transitive',
          depth
        });

        // Enqueue cascading contracts exported by the now-flagged dependent node
        const cascadingContracts = contracts.filter(c => c.node_id === dependentNode.id);
        for (const cContract of cascadingContracts) {
          queue.push([cContract.id, depth + 1]);
        }
      }
    }

    // S012: graph is consistent when no nodes need review and all nodes are stable or roadmap.
    // Roadmap nodes are planned-but-not-yet-built and are an acceptable stable state.
    return {
      consistent: flaggedNodes.length === 0 && nodes.every(n => n.status === 'stable' || n.status === 'roadmap'),
      flagged: flaggedNodes,
      timestamp: new Date().toISOString()
    };
  }
}
