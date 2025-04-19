---
title: "Getting Started with OpenCloud App Development"
sidebar_position: 0
---

# Getting Started with OpenCloud App Development

## Introduction

OpenCloud is a powerful cloud collaboration platform that allows developers to extend its functionality through custom applications and extensions. Whether you're looking to add new file viewers, integrate with external services, or build entirely new collaborative experiences, OpenCloud's extension system provides the tools and frameworks you need.

This guide introduces the fundamentals of OpenCloud app development, covering the key concepts, available frameworks, and development workflow.

## What are OpenCloud Apps?

OpenCloud apps are web-based applications that integrate with the OpenCloud platform. They can extend the platform in various ways:

- **File Viewers & Editors**: Custom interfaces for viewing or editing specific file types
- **File Actions**: Adding new operations that can be performed on files
- **Sidebar Panels**: Custom panels that display in the file sidebar
- **External Integrations**: Connecting OpenCloud to external services and applications
- **UI Extensions**: Adding new elements to the OpenCloud interface
- **Backend Services**: Custom services that extend OpenCloud's functionality

Apps are built using modern web technologies, primarily Vue.js, and are integrated into OpenCloud through its extension system.

## Types of Extensions

OpenCloud supports several types of extensions:

1. **Viewers & Editors**: 
   - Examples: Draw.io, EPub Reader, PDF Viewer, Text Editor
   - Purpose: Provide custom interfaces for specific file types

2. **File Actions**:
   - Examples: Cast (for Chromecast), Unzip
   - Purpose: Add new functionality accessible from the file context menu

3. **File Sidebar Panels**:
   - Examples: Audio Information, EXIF/Image Information
   - Purpose: Display contextual information in the sidebar

4. **Global UI Elements**:
   - Examples: Progress bars, navigation extensions
   - Purpose: Customize the overall user experience

5. **Standalone Applications**:
   - Purpose: Create entirely new applications within the OpenCloud ecosystem

## Development Environment

To get started with OpenCloud app development, you'll need to set up a development environment. The [web-app-skeleton](https://github.com/opencloud-eu/web-app-skeleton) repository provides a boilerplate setup for new apps.

### Prerequisites

- Docker and Docker Compose
- Node.js
- pnpm package manager

### Quick Start

1. Clone the web-app-skeleton repository:
   ```bash
   git clone https://github.com/opencloud-eu/web-app-skeleton myapp
   cd myapp
   ```

2. Install dependencies and run the initial build:
   ```bash
   pnpm install && pnpm build:w
   ```

3. Start the development environment:
   ```bash
   docker compose up
   ```

4. Access your development instance at `https://host.docker.internal:9200` with credentials admin/admin

5. Your app will be automatically loaded in this environment

## Development Workflow

1. **Design Your App**: 
   - Determine what functionality your app will provide
   - Choose the extension points you'll use
   - Plan the user interface

2. **Implement Your App**:
   - Modify the files in the `src` folder
   - The entry point is `src/index.ts`
   - Define your app's name, ID, and extension points

3. **Test Your App**:
   - Use the built-in testing framework
   - Test your app in the development environment

4. **Build for Production**:
   - Run `pnpm build` to create a production build
   - The output will be in the `dist` folder

5. **Distribute Your App**:
   - Package your app as a ZIP file
   - Include the manifest.json file
   - Deploy to OpenCloud instances

## Technology Stack

OpenCloud apps typically use the following technologies:

- **Vue.js**: Frontend framework
- **TypeScript**: Programming language
- **@opencloud-eu/web-pkg**: OpenCloud web package providing APIs and utilities
- **Vite**: Build tool
- **Vitest**: Testing framework

## Key Concepts

### App Structure

Every OpenCloud app follows a similar structure:

- **Entry Point** (`src/index.ts`): Defines the app and its extension points
- **Manifest File** (`public/manifest.json`): Contains metadata about the app
- **Components** (`src/*.vue`): Vue components that make up the app's UI
- **App Definition**: Uses `defineWebApplication` to configure the app

### Extension Registration

Apps register their extension points through the app definition:

```typescript
// Example: Registering a file viewer
export default defineWebApplication({
  setup() {
    const { $gettext } = useGettext()

    const routes = [
      {
        name: 'my-app',
        path: '/:driveAliasAndItem(.*)?',
        component: AppWrapperRoute(MyAppViewer, {
          applicationId: 'my-app'
        }),
        meta: {
          authContext: 'hybrid',
          title: $gettext('My App'),
          patchCleanPath: true
        }
      }
    ]

    const appInfo = {
      name: $gettext('My App'),
      id: 'my-app',
      icon: 'file-text',
      defaultExtension: 'myformat',
      extensions: [
        {
          extension: 'myformat',
          routeName: 'my-app'
        }
      ]
    }

    return {
      appInfo,
      routes
    }
  }
})
```

### OpenCloud APIs

Apps can interact with OpenCloud through several APIs:

- **File Management**: Operations on files and folders
- **User Management**: Access to user information and permissions
- **UI Integration**: Integration with the OpenCloud interface
- **Events**: Responding to system events

## Example Applications

The [web-extensions](https://github.com/opencloud-eu/web-extensions) repository contains several example applications that demonstrate different types of extensions:

- [web-app-draw-io](https://github.com/opencloud-eu/web-extensions/tree/main/packages/web-app-draw-io): A diagram editor
- [web-app-json-viewer](https://github.com/opencloud-eu/web-extensions/tree/main/packages/web-app-json-viewer): A JSON file viewer
- [web-app-external-sites](https://github.com/opencloud-eu/web-extensions/tree/main/packages/web-app-external-sites): Integration with external websites
- [web-app-unzip](https://github.com/opencloud-eu/web-extensions/tree/main/packages/web-app-unzip): A file action for extracting ZIP files

Studying these examples can provide valuable insights into different approaches to app development.

## Storage and Data Management

One of the challenges in app development is data management. OpenCloud does not provide a native database solution, but there are several approaches to storing and managing structured data:

- **File-based storage**: Using the filesystem to store data
- **Metadata-based approach**: Using file metadata for indexing and queries
- **External services**: Connecting to external databases or services

For more detailed information on storage options, see the [Data Management and Storage Backends](storage-backends.md) guide.

## Next Steps

Now that you understand the basics of OpenCloud app development, you can:

1. Set up your development environment using the [web-app-skeleton](https://github.com/opencloud-eu/web-app-skeleton)
2. Explore the [example applications](https://github.com/opencloud-eu/web-extensions) to understand different types of extensions
3. Learn about [data management strategies](storage-backends.md) for your app
4. Start building your own app!

Remember to check the [official OpenCloud documentation](https://docs.opencloud.eu/) for detailed API references and developer guides.

Happy coding!