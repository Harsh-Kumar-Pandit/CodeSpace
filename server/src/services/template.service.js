
import prisma from "../config/prisma.js";

const templates = {
  node: [
    {
      name: "package.json",
      content: JSON.stringify(
        {
          name: "my-node-app",
          version: "1.0.0",
          type: "module",
          scripts: { start: "node index.js" }
        },
        null,
        2
      ),
    },
    {
      name: "index.js",
      content: 'console.log("Hello from Code Space!");\n',
    },
    {
      name: ".gitignore",
      content: "node_modules/\n.env\ndist/\n",
    },
  ],

  react: [
    {
      name: "package.json",
      content: JSON.stringify(
        {
          name: "my-react-app",
          version: "1.0.0",
          type: "module",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview",
          },
          dependencies: {
            react: "^19.0.0",
            "react-dom": "^19.0.0",
          },
          devDependencies: {
            "@vitejs/plugin-react": "^4.3.0",
            vite: "^6.0.0",
          },
        },
        null,
        2
      ),
    },
    {
      name: "index.html",
      content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Code Space App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
    },
    {
      name: "src",
      type: "FOLDER",
    },
  ],
};

export function getAvailableTemplates() {
  return [
    { id: "node", name: "Node.js", description: "A basic JavaScript starter" },
    { id: "react", name: "React + Vite", description: "A React frontend starter" },
  ];
}

export async function createProjectFromTemplate(
  userId,
  { name, description, templateId }
) {
  const templateFiles = templates[templateId];

  if (!templateFiles) {
    const error = new Error("Unsupported project template");
    error.statusCode = 400;
    throw error;
  }

  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: {
        name,
        description,
        ownerId: userId,
      },
    });

    const folders = {};

    for (const file of templateFiles) {
      if (file.type === "FOLDER") {
        const folder = await tx.projectFile.create({
          data: {
            name: file.name,
            type: "FOLDER",
            projectId: project.id,
          },
        });

        folders[file.name] = folder.id;
      } else {
        await tx.projectFile.create({
          data: {
            name: file.name,
            type: "FILE",
            content: file.content,
            projectId: project.id,
          },
        });
      }
    }

    if (templateId === "react" && folders.src) {
      await tx.projectFile.create({
        data: {
          name: "main.jsx",
          type: "FILE",
          projectId: project.id,
          parentId: folders.src,
          content: `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
        },
      });

      await tx.projectFile.create({
        data: {
          name: "App.jsx",
          type: "FILE",
          projectId: project.id,
          parentId: folders.src,
          content: `export default function App() {
  return <h1>Hello from Code Space!</h1>;
}
`,
        },
      });
    }

    return project;
  });
}
