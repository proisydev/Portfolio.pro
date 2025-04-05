export interface Project {
  author?: string;
  name: string;
  description: string;
  language: string[];
  link: string;
  githubPagesUrl?: string; // ✅ New field for GitHub Pages
  stars?: number;
  forks?: number;
}

// 🔹 Function to test whether a website exists (HTTP 200 response)
async function checkWebsiteExists(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: "HEAD" }); // Checks only if URL responds
    return response.ok;
  } catch {
    return false; // If the URL does not respond, returns false
  }
}

// 🔹 Main function for retrieving projects and testing URLs
export async function fetchProjects(username: string): Promise<Project[]> {
  try {
    if (!username) {
      throw new Error("❌ [projects] GITHUB_USERNAME is empty or undefined");
    }

    const url = `https://pinned.berrysauce.dev/get/${username}`;
    console.log(`🔎 [projects] Fetching projects from: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `❌ [projects] HTTP error ${response.status}: ${response.statusText}`,
      );
    }

    const data = await response.json();
    if (!data || !Array.isArray(data)) {
      throw new Error("❌ [projects] Invalid or non-compliant project data");
    }

    console.log("✅ [projects] Projects successfully recovered :", data.length);

    // 🔹 Checks every project
    return await Promise.all(
      data.map(async (project: any) => {
        const githubPagesUrl = `https://${project.author}.github.io/${project.name}`;

        // 🔹 Checks whether GitHub Pages is active
        const isGithubPagesActive = githubPagesUrl
          ? await checkWebsiteExists(githubPagesUrl)
          : false;

        return {
          ...project,
          language: Array.isArray(project.language)
            ? project.language
            : project.language
              ? [project.language] // Converts to array if string
              : [],

          githubPagesUrl: isGithubPagesActive ? githubPagesUrl : undefined, // ✅ Adds URL only if valid
        };
      }),
    );
  } catch (error) {
    console.error("❌ [projects] Error when fetching projects :", error);
    return [];
  }
}
