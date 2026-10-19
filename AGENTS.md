These are the coding standards from this project, do not deviate from them:

# Frontend

Built using React, react-router, TypeScript, and tailwind, the frontend is supposed to be modular and clean.

Ensure all UI code follows the design system of the application. Make use of the theme-based tailwind variables, never hardcode colors.
Always use the existing shadcn primitive components, never implement custom ones. You may use the shadcn CLI to import missing ones.
Ensure to add subtle animations and loading states to make the platform feel interactive.

Fetch/API requests to the backend should never assume a specific hostname, use the existing api infrastructure in the code.
Make typescript interfaces for commonly reused code. Ensure everything is mobile responsive.
Use the existing "useStatusTracker" and StatusMessage to track display all interactive messages/errors from the backend.

Use tabler icons where possible for interactive elements. As a general rule of thumb each file should only have 1 react component.


# Backend

Built using C# and ASP.NET Core, all server code must be secure and follow the latest .NET 10 best practices.

All database interactions must must be performed using Entity Framework Core with proper use of asynchronous programming patterns. Never write any raw database queries or use any other ORM. All database access must be done through Entity Framework Core to ensure security and maintainability.

Ensure to run migrations properly and keep the database schema up to date with the codebase. All types should be defined in a way that they can be easily serialized and deserialized for API communication. Always handle exceptions gracefully and provide meaningful error messages to the client. Use LINQ where possible and ensure that the code is modular, maintainable, and testable.

Ensure all CRUD functions of the project require proper authentication and authorization checks to prevent unauthorized access. Always follow best practices for security, including input validation, output encoding, and secure handling of sensitive data. Regularly review and update the code to address any security vulnerabilities or performance issues. Always write clean, readable, and well-documented code and use controllers for handling API requests. 

- Class-level variables/fields/properties should all be in PascalCase (no leading underscores allowed even for private)
- Function-scoped variables should be camelCase

# General Practices

- Organize code into appropriate folders clearly
- Avoid large files, split UI components and API controllers up into multiple files and organize them well
- Avoid redundant comments, ones with emojis/symbols, and comments that split up sections of code (except #region blocks)
- Run npm lint/dotnet build to check the code is valid, do not run the project yourself (except tests) or open a browser
- Never hardcode UI strings or response messages, use i18n for everything displayed to the user and map server response messages in the en.json file.
- Do not use trailing full stops in UI strings
- Avoid files more than 300 lines