# Development Workflow

## Mandatory Rule

Every feature must follow:

1. Write tests first.
2. Implement code.
3. Run tests and pass.
4. Only then move to the next task.

## Scope

- Unit tests for domain logic.
- Integration tests for API and data flow.
- Regression tests for bug fixes.

## PR Checklist

1. New behavior has tests.
2. Existing tests pass.
3. Build passes for `server` and `frontend`.
4. Notes updated in `README.md` / `docs`.
