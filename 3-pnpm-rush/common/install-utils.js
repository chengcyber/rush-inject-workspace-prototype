const path = require('path');

const projects = {
  lib: {
    projectRelativeFolder: "lib",
  },
  app1: {
    projectRelativeFolder: "app1",
  },
  app2: {
    projectRelativeFolder: "app2",
  },
};

function rewriteRushProjectVersions(packageName, dependencies, packageJson) {
  if (!dependencies) {
    return;
  }
  const project = projects[packageName];
  if (!project) {
    return;
  }

  for (const dependencyName of Object.keys(dependencies)) {
    const currentVersion = dependencies[dependencyName];
    if (currentVersion.startsWith("workspace:")) {
      const workspaceProject = projects[dependencyName];
      if (!workspaceProject) {
        continue;
      }
      // workspace:* -> file:relative/path/to/lib
      const relativePath = path.relative(
        project.projectRelativeFolder,
        workspaceProject.projectRelativeFolder
      );
      const newVersion = `file:${relativePath}`;
      dependencies[dependencyName] = newVersion;

      // set dependenciesMeta.lib.injected to true
      const dependenciesMeta = packageJson.dependenciesMeta || {};
      const dependencyMeta = dependenciesMeta[dependencyName] || {};
      dependencyMeta.injected = true;
      dependenciesMeta[dependencyName] = dependencyMeta;
      packageJson.dependenciesMeta = dependenciesMeta;
    }
  }
}

module.exports = {
  rewriteRushProjectVersions,
};
