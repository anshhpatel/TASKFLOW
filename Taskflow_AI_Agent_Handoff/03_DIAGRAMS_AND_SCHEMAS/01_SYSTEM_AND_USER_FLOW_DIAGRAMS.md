# Taskflow — System and User Flow Diagrams

## System architecture
```mermaid
flowchart LR
    User --> UI[React / TypeScript / Tailwind]
    UI --> API[FastAPI]
    API --> Auth[Auth module]
    API --> Goals[Goals module]
    API --> Tasks[Tasks module]
    API --> Routines[Routine module]
    API --> Missions[Daily Missions aggregation]
    API --> Reminders[Reminder / notification module]
    API --> Progress[Progress module]
    API --> Focus[Focus support module]
    Auth --> PG[(PostgreSQL)]
    Goals --> PG
    Tasks --> PG
    Routines --> PG
    Reminders --> PG
    Progress --> PG
```

## Use-case diagram
```mermaid
flowchart TB
    User((User))
    subgraph Taskflow
      UC1([Register / Login / Logout])
      UC2([Manage Goals])
      UC3([Create / Edit / Complete Tasks])
      UC4([Manage Routines])
      UC5([View Today's Daily Missions])
      UC6([Configure Reminders])
      UC7([View Notifications])
      UC8([View Progress])
      UC9([Get Focus / Slump Prompt])
    end
    User --- UC1
    User --- UC2
    User --- UC3
    User --- UC4
    User --- UC5
    User --- UC6
    User --- UC7
    User --- UC8
    User --- UC9
```

## Daily workflow activity diagram
```mermaid
flowchart TD
    Start([Start]) --> Login{Authenticated?}
    Login -- No --> SignIn[Register or log in]
    SignIn --> Today
    Login -- Yes --> Today[Open Dashboard / Today]
    Today --> Missions[Load today's tasks and routine occurrences]
    Missions --> Action{Choose action}
    Action -- Complete --> Save[Persist completion]
    Action -- Create/edit --> Task[Validate and save task]
    Action -- Reminder --> Reminder[Save reminder settings]
    Action -- Stuck --> Prompt[Show small next action]
    Save --> Progress[Recalculate progress]
    Task --> Missions
    Reminder --> Missions
    Prompt --> Missions
    Progress --> Missions
    Missions --> End([Continue / Exit])
```

## Data model
See `02_IMPLEMENTATION_SPEC/04_DATA_MODEL.md` for entity details and ownership/integrity rules.
