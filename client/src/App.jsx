
import { useEffect, useState } from "react";
import {
  createProject,
  deleteProject,
  getProjects,
} from "./services/projects";

export default function App() {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProjects() {
    try {
      setError("");
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load projects. Please log in first."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function handleCreate(event) {
    event.preventDefault();

    if (!name.trim()) return;

    try {
      setError("");

      const project = await createProject({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      setProjects((current) => [project, ...current]);
      setName("");
      setDescription("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not create project."
      );
    }
  }

  async function handleDelete(projectId) {
    if (!window.confirm("Delete this project and all its files?")) {
      return;
    }

    try {
      await deleteProject(projectId);

      setProjects((current) =>
        current.filter((project) => project.id !== projectId)
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not delete project."
      );
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold">Code Space</h1>
          <p className="mt-2 text-slate-400">
            Your projects, your workspace.
          </p>
        </header>

        <form
          onSubmit={handleCreate}
          className="mb-8 grid gap-3 rounded-xl border border-slate-800 bg-slate-900 p-5"
        >
          <h2 className="text-xl font-semibold">Create a project</h2>

          <input
            className="rounded-lg border border-slate-700 bg-slate-950 p-3"
            placeholder="Project name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
          />

          <input
            className="rounded-lg border border-slate-700 bg-slate-950 p-3"
            placeholder="Description (optional)"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={500}
          />

          <button className="rounded-lg bg-indigo-600 p-3 font-medium hover:bg-indigo-500">
            Create project
          </button>
        </form>

        {error && (
          <p role="alert" className="mb-5 text-red-400">
            {error}
          </p>
        )}

        <h2 className="mb-4 text-xl font-semibold">Your projects</h2>

        {loading ? (
          <p className="text-slate-400">Loading projects...</p>
        ) : projects.length === 0 ? (
          <p className="text-slate-400">
            No projects yet. Create your first one above.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <article
                key={project.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5"
              >
                <h3 className="text-lg font-semibold">
                  {project.name}
                </h3>

                <p className="mt-2 min-h-12 text-sm text-slate-400">
                  {project.description || "No description"}
                </p>

                <button
                  onClick={() => handleDelete(project.id)}
                  className="mt-5 rounded-lg border border-red-900 px-3 py-2 text-sm text-red-400 hover:bg-red-950"
                >
                  Delete project
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
