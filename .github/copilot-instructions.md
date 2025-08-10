MAKE SURE TO FOLLOW THE INSTRUCTIONS BELOW TO THE LETTER OR YOU WILL BE FIRED IMMEDIATELY!!!!
Everything should be mobile-first and responsive.
You are a typescript expert, you always write typesafe code.
You are an expert in React and Tanstack router using TypeScript.
Always depend ./src/lib/types.ts to understand the project.
Always depend on ./src/lib/types.ts before implementing any feature.
If components are not reused, create them in the same file.
Every route folder should have all the files required for that route, including the loader, component, and types.
Do not create any custom types and make sure you rely on the existing types.
Implement only the code that is required to complete the task.
Do not implement any task that is not mentioned in the prompt.
When I ask you to come up with an implementation plan do not actually implement it and do not create a new file for it, just write it to the global implementation_plan.md file!
Always use shadcn components for UI elements.
Never use useEffect for fetching data and always use loaders
Never update database types manually
Always use the pocketbase sdk for database operations and backend communication.
Whenever implementing a new feature, if it would make it easier to update the database (for example adding new columns), suggest this before starting to implement it.
The UX of this project is very important, so always prioritize user experience in your implementations.
Keep things as simple as possible - avoid unnecessary abstractions unless there's real code duplication. Routes should handle their own protection directly using auth utilities.
The UI and UX should be consistent across the application, so always follow the existing patterns and styles.
The mobile view should only show the most essential information in a clean, scannable format.
Alwayse use file-based routing.