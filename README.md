# rush-inject-workspace-prototype

# 1. Original PNPM workspace

This workspace contains 3 projects `lib`, `app1`, `app2`.

where lib has a peerDependency of `react>=16.8.0` and install a `react@17.0.2` as a devDependencies. This represents a normal case for a react component package.

And `app1` depends on `react@16.14.0`; `app2` depends on `react@18.2.0`. They all depend on `lib`.

The expected situation is the react used in `lib` package can be resolved to the react version installed in the app projects `app1`, `app2` here.

## Installing and running this example:

```
cd 1-pnpm

# Install the dependencies
pnpm install -r

# Run the projects
pnpm -r run start
```

It says:

```
app2 start$ node index.js
│ 17.0.2
└─ Done in 46ms
app1 start$ node index.js
│ 17.0.2
└─ Done in 56ms
```

The actual behavior is the react version used in `lib` package resolved to dev dependency react of `lib` itself. This is a resolving issue of peer dependency in monorepo packages.

# 2. Injected workspaces

> The existing solution to the peer dependency issue is [injected](https://pnpm.io/package_json#dependenciesmetainjected) feature. Let's try to see what we can get with injected feature.

This workspaces contains 3 workspaces `shared`, `team1`, `team2`.

where `shared` workspace contains a shared library used by other workspaces, `team1` and `team2` are two diffrent workspaces and both contains two app type packages `app1` and `app2`.
The only diffrence is that apps in `team1` workspace use `link` protocol while apps in `team2` workspace use `file` protocol.

**team1/app1/package.json** 

```json
{
    "dependencies": {
        "lib": "link:../../shared/lib",
        "react": "18.2.0"
    }
}
```

**team1/app2/package.json**

```json
{
    "dependencies": {
        "lib": "link:../../shared/lib",
        "react": "18.2.0"
    },
    "dependenciesMeta": {
        "lib": {
            "injected": true
        }
    }
}
```

**team2/app1/package.json**

```json
{
    "dependencies": {
        "lib": "file:../../shared/lib",
        "react": "16.14.0"
    }
}
```

**team2/app2/package.json**

```json
{
    "dependencies": {
        "lib": "file:../../shared/lib",
        "react": "16.14.0"
    },
    "dependenciesMeta": {
        "lib": {
            "injected": true
        }
    }
}
```

## Installing and running this example:

```
cd 2-pnpm-inject-workspaces

# Install the dependencies
./install.sh

# Run the projects
./start.sh
```

The actual behavior is that

In pnpm 7 and 8, it says:

```
No projects matched the filters "/Users/admin/code/rush-inject-workspace-prototype/2-pnpm-inject-workspaces/team1" in "/Users/admin/code/rush-inject-workspace-prototype/2-pnpm-inject-workspaces/team1"
Scope: all 2 workspace projects
app1 start$ node index.js
│ 17.0.2
└─ Done in 51ms
app2 start$ node index.js
│ 17.0.2
└─ Done in 52ms
No projects matched the filters "/Users/admin/code/rush-inject-workspace-prototype/2-pnpm-inject-workspaces/team2" in "/Users/admin/code/rush-inject-workspace-prototype/2-pnpm-inject-workspaces/team2"
Scope: all 2 workspace projects
app1 start$ node index.js
│ 16.14.0
└─ Done in 41ms
app2 start$ node index.js
│ 16.14.0
└─ Done in 41ms
```

Pnpm resolves the correct react version when using `file` protocol no matter of specifying "injected" or not.

Note, things get different in pnpm@6. When using pnpm@6, it says:

```
Scope: all 2 workspace projects
app1 start$ node index.js
│ 17.0.2
└─ Done in 52ms
app2 start$ node index.js
│ 18.2.0
└─ Done in 52ms
Scope: all 2 workspace projects
app1 start$ node index.js
│ 17.0.2
└─ Done in 56ms
app2 start$ node index.js
│ 16.14.0
└─ Done in 58ms
```

Pnpm resolves the correct react version when specifying "injected" no matter of the protocol

Conclusion: Using "file" protocol with specifying as "injected" is the proper way to make peer dependencies getting resolved correctly.

# 3. Recreating this idea with Rush

The **3-pnpm-rush** folder contains a Rush monorepo, whose `rush.json` refers to the `app1` and `app2` projects depend on `lib`, `rush-install.sh` pretends to be `rush install` and `rush-build.sh` pretends to be `rush build`.

**rush.json**

```json
    {
      "packageName": "lib",
      "projectFolder": "lib"
    },
    {
      "packageName": "app1",
      "projectFolder": "app1"
      // injectedWorkspace: "team1"
    },
    {
      "packageName": "app2",
      "projectFolder": "app2"
      // injectedWorkspace: "team2"
    }
```

`injectedWorkspace: "team1"` here indicates the project should be installed in a injected workspace called `team1`, which locates `common/injected/team1` folder.

So, there will be three PNPM workspaces in these folders:

- `common/temp` Rush.js default workspace
- `common/injected/team1` "team1" injected workspace
- `common/injected/team2` "team2" injected workspace

## Installing this example:

```
cd 3-pnpm-rush

# Install dependencies
./rush-install.sh
```

**rush-install.sh** simply go through these three folders and call `pnpm install`

The magic happens in `.pnpmfile.cjs` under `common/injected/team{1,2}` folders. In the files, `workspace:*` is replaced to `file:<relative_path>` and set dependenciesMeta.*.injected to true when installing.

## Building this example:

```
./rush-build.sh
```

It says:

```
> app1@1.0.0 build /Users/admin/code/rush-inject-workspace-prototype/3-pnpm-rush/app1
> node index.js

18.2.0

> app2@1.0.0 build /Users/admin/code/rush-inject-workspace-prototype/3-pnpm-rush/app2
> node index.js

16.14.0
```

As you can see, react are resolved to the correct versions now!

# Proposal

- patch the Rush software so that `rush install` automatically generates and installs extra injected workspaces, using `injectedWorkspace: <name>` to recognize the projects that be maintained differently.
- `rush install` will also inject the **.pnpmfile.cjs** workaround to rewrite `workspace:*` -> `file:*` and specifying **dependenciesMeta.*.injected* true as appropriate. (npm alias should be taken care of as well)
- path the Rush software so that `rush build` considers processes all projects (`app1`, `app2`) as if they belong to a single workspace.
