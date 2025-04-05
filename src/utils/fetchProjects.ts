/**
 * Interface representing a project with its associated details.
 */
export interface Project {
  author?: string;
  name: string;
  description: string;
  language: string[];
  link: string;
  githubPagesUrl?: string; // New field for GitHub Pages
  stars?: number;
  forks?: number;
}

/**
 * Checks whether a website exists by sending a HEAD request.
 * This function is used to verify if the URL responds with a valid HTTP status (200).
 *
 * @param {string} url - The URL of the website to check.
 * @returns {Promise<boolean>} - Resolves to true if the website exists, otherwise false.
 */
async function checkWebsiteExists(url: string): Promise<boolean> {
  try {
    // Sends a HEAD request to check if the URL responds without downloading the entire content.
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    // In case of any error (e.g., network issues), returns false.
    return false;
  }
}

/**
 * Fetches projects for a given GitHub username and verifies the status of associated GitHub Pages.
 *
 * The function retrieves project data from the API endpoint:
 * `https://pinned.berrysauce.dev/get/${username}`.
 * For each project, it:
 *  - Ensures the 'language' field is an array.
 *  - Checks if a corresponding GitHub Pages site is active.
 *
 * @param {string} username - The GitHub username for which projects are to be fetched.
 * @returns {Promise<Project[]>} - A promise that resolves to an array of Project objects.
 *
 * @throws Will throw an error if the username is empty or if the API response is invalid.
 *
 * @example
 * const projects = await fetchProjects("username");
 * console.log(projects);
 */
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

    console.log("✅ [projects] Projects successfully recovered:", data.length);

    // Process each project: format language array and verify GitHub Pages availability.
    return await Promise.all(
      data.map(async (project: any) => {
        const githubPagesUrl = `https://${project.author}.github.io/${project.name}`;

        // Check if GitHub Pages is active for the project.
        const isGithubPagesActive = githubPagesUrl
          ? await checkWebsiteExists(githubPagesUrl)
          : false;

        return {
          ...project,
          language: Array.isArray(project.language)
            ? project.language
            : project.language
              ? [project.language] // Convert to array if the language is provided as a string.
              : [],
          githubPagesUrl: isGithubPagesActive ? githubPagesUrl : undefined, // Only add URL if valid.
        };
      }),
    );
  } catch (error) {
    console.error("❌ [projects] Error when fetching projects:", error);
    return [];
  }
}
