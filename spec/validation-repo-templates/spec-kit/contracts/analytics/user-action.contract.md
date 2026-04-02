---
ferret:
  id: event.user-action
  type: event
  imports:
    - auth.jwt
  shape:
    type: object
    properties:
      userId:
        type: string
      action:
        type: string
      timestamp:
        type: string
        format: date-time
    required: [userId, action, timestamp]
---

# User Action Event Contract
