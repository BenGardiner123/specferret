---
ferret:
  id: api.GET/search
  type: api
  imports:
    - auth.jwt
  shape:
    request:
      type: object
      properties:
        query:
          type: string
      required: [query]
    response:
      type: array
      items:
        type: object
        properties:
          id:
            type: string
          title:
            type: string
        required: [id, title]
---

# Search Contract
