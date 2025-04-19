---
title: "Data Management in OpenCloud Apps"
sidebar_position: 1
---

# Data Management and Storage Backends for OpenCloud Apps

This documentation describes the various options for data management and storage backends in OpenCloud applications. It is intended for app developers who want to store and manage structured or relational data in their OpenCloud applications.

## Introduction

One of the most common challenges when developing OpenCloud apps is managing structured or relational data. Since OpenCloud does not provide an integrated database solution, developers need to choose alternative approaches for data management. This documentation presents the available options and provides recommendations for different use cases.

## Available Storage Backends in OpenCloud

OpenCloud offers various storage backend implementations optimized for different use cases. Choosing the right backend depends on your specific requirements.

### 1. DecomposedFS

DecomposedFS is the traditional storage backend in OpenCloud, organizing files and metadata in a specialized structure.

#### Key Concepts:

- **Separation of Content and Metadata**: File contents are stored as "blobs", separate from their metadata
- **Node-based Structure**: Everything is a "node" with a unique ID and relationships to other nodes
- **Metadata Management**: Supports two approaches - xattrs or MessagePack files

#### Metadata Storage:

- **xattrs Backend**: Stores metadata as extended file attributes
- **MessagePack Backend**: Stores metadata in separate `.mpk` files

#### Advantages for App Development:

- Extensive metadata support
- Efficient storage for complex data structures
- Ability to encode structured data in metadata

### 2. DecomposedS3

DecomposedS3 extends DecomposedFS by using S3-compatible object storage for file contents.

#### Key Concepts:

- **Hybrid Storage Model**: Metadata locally, contents in S3
- **S3 Integration**: Supports all S3-compatible services (AWS S3, MinIO, Ceph, etc.)
- **Scalability**: Nearly unlimited storage capacity

#### Advantages for App Development:

- Cloud-native approach for large amounts of data
- Cost efficiency through tiered storage
- Geo-replication and high availability

### 3. PosixFS

PosixFS is the most modern storage implementation in OpenCloud, optimized for POSIX-compliant filesystems.

#### Key Concepts:

- **Direct File Storage**: Files are stored directly in the filesystem
- **Hybrid Metadata**: Combination of xattrs for small metadata and separate files for large metadata
- **Filesystem Monitoring**: Detection of changes directly in the filesystem

#### Advantages for App Development:

- Direct access to files even outside of OpenCloud
- Overcoming xattr size limitations
- Integration with external tools and workflows

## Strategies for Relational Data in OpenCloud Apps

There are several strategies for managing relational or structured data in OpenCloud apps:

### 1. File-based Approach

This approach uses the filesystem directly to store structured data.

#### Implementation:

```javascript
// Example: Store structured data in JSON files
class FileBasedStore {
  constructor(client) {
    this.client = client; // OpenCloud client
    this.basePath = '/app-data';
  }

  async createCollection(name) {
    return this.client.createDirectory(`${this.basePath}/${name}`);
  }

  async create(collection, id, data) {
    const path = `${this.basePath}/${collection}/${id}.json`;
    return this.client.putFile(path, JSON.stringify(data));
  }

  async get(collection, id) {
    const path = `${this.basePath}/${collection}/${id}.json`;
    const content = await this.client.getFile(path);
    return JSON.parse(content);
  }
}
```

#### Advantages:

- Simple implementation
- Good performance for small to medium data volumes
- Natural hierarchy through directory structure

#### Disadvantages:

- Limited query capabilities
- No transactional protection
- Inefficient for complex relationships

### 2. Metadata-based Approach

This approach uses OpenCloud's metadata features for indexing and quick queries.

#### Implementation:

```javascript
// Example: Using metadata for indexing
class MetadataStore {
  constructor(client) {
    this.client = client;
    this.basePath = '/app-data';
  }

  async createIndex(collection, field) {
    const path = `${this.basePath}/${collection}`;
    await this.client.createDirectory(path);
    
    // Store index definition as metadata
    const indexes = JSON.parse(await this.client.getProperty(path, 'user.app.indexes') || '[]');
    indexes.push(field);
    await this.client.setProperty(path, 'user.app.indexes', JSON.stringify(indexes));
  }

  async create(collection, data) {
    const id = uuid();
    const path = `${this.basePath}/${collection}/${id}.json`;
    
    // Store data
    await this.client.putFile(path, JSON.stringify(data));
    
    // Update indices
    const indexes = JSON.parse(await this.client.getProperty(
      `${this.basePath}/${collection}`, 'user.app.indexes') || '[]');
    
    for (const field of indexes) {
      if (data[field]) {
        await this.client.setProperty(path, 
          `user.app.index.${field}`, String(data[field]));
      }
    }
    
    return id;
  }

  async findBy(collection, field, value) {
    // Use WebDAV PROPFIND or LibreGraph API
    const results = await this.client.findByProperty(
      `${this.basePath}/${collection}`, 
      `user.app.index.${field}`, 
      String(value));
    
    return Promise.all(results.map(path => 
      this.client.getFile(path).then(JSON.parse)));
  }
}
```

#### Advantages:

- Efficient indexing and queries
- Good integration with OpenCloud storage
- Support for relationships through metadata

#### Disadvantages:

- More complex implementation
- Limitations due to metadata size
- No complex transactions

### 3. External Service Approach

For more complex requirements, a separate microservice with a real database can be developed.

#### Implementation:

```javascript
// Frontend component for external database
class ExternalDBClient {
  constructor(apiBaseUrl) {
    this.apiUrl = apiBaseUrl;
  }

  async query(collection, filter) {
    const response = await fetch(`${this.apiUrl}/${collection}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filter })
    });
    return response.json();
  }

  async create(collection, data) {
    const response = await fetch(`${this.apiUrl}/${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
}

// Backend implementation (separate service)
// Uses a real database like PostgreSQL, MongoDB, etc.
```

#### Advantages:

- Full database functionality
- Best performance and scalability
- Support for complex queries and transactions

#### Disadvantages:

- Increased complexity in deployment and maintenance
- Additional infrastructure required
- More development effort

## Recommendations by Use Case

### For simple apps with small amounts of data:

- **Recommendation**: File-based approach
- **Storage Backend**: Any backend (PosixFS preferred for direct access)
- **Advantages**: Simple implementation, no additional infrastructure

### For apps with medium data volumes and query requirements:

- **Recommendation**: Metadata-based approach
- **Storage Backend**: PosixFS with hybrid metadata
- **Advantages**: Good balance of performance and complexity

### For enterprise-critical apps with complex data structures:

- **Recommendation**: External service approach
- **Storage Backend**: DecomposedS3 for files, external database for structured data
- **Advantages**: Highest performance, full database functionality

## Example Implementation: Task Manager App

The following example implementation shows a metadata-based approach for a simple task manager app:

```javascript
class TaskStore {
  constructor(client) {
    this.client = client;
    this.basePath = '/app-data/tasks';
  }

  async initialize() {
    // Create base directory
    await this.client.createDirectory(this.basePath);
    
    // Create projects directory
    await this.client.createDirectory(`${this.basePath}/projects`);
    
    // Define indices
    await this.client.setProperty(this.basePath, 
      'user.app.indexes', JSON.stringify(['assignee', 'dueDate', 'status']));
  }

  // Create project
  async createProject(name, description) {
    const id = uuid();
    const path = `${this.basePath}/projects/${id}`;
    
    await this.client.createDirectory(path);
    await this.client.setProperty(path, 'user.app.name', name);
    await this.client.setProperty(path, 'user.app.description', description);
    
    return id;
  }

  // Create task
  async createTask(projectId, task) {
    const id = uuid();
    const path = `${this.basePath}/projects/${projectId}/${id}.json`;
    
    // Save task as JSON
    await this.client.putFile(path, JSON.stringify(task));
    
    // Update indices
    const indexes = JSON.parse(await this.client.getProperty(
      this.basePath, 'user.app.indexes'));
    
    for (const field of indexes) {
      if (task[field]) {
        await this.client.setProperty(path, 
          `user.app.index.${field}`, String(task[field]));
      }
    }
    
    return id;
  }

  // Find tasks by assignee
  async findTasksByAssignee(assignee) {
    return this.client.findByProperty(
      this.basePath, 'user.app.index.assignee', assignee)
      .then(paths => Promise.all(
        paths.map(path => this.client.getFile(path).then(JSON.parse))
      ));
  }

  // List project tasks
  async listProjectTasks(projectId) {
    const files = await this.client.listFiles(
      `${this.basePath}/projects/${projectId}`);
    
    return Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(path => this.client.getFile(path).then(JSON.parse))
    );
  }
}
```

## Best Practices

1. **Data Modeling**:
   - Use the hierarchical structure of the filesystem for natural relationships
   - Store related data in common directories
   - Plan your indexing strategy in advance

2. **Performance Optimization**:
   - Use metadata for frequently queried fields
   - Limit the size of individual files
   - Use batch operations for multiple changes

3. **Data Security**:
   - Implement permission checks in your app
   - Avoid storing sensitive data in filenames
   - Validate all user inputs

4. **Error Handling**:
   - Implement robust error handling
   - Plan for recovery after errors
   - Use atomic operations where possible

## Conclusion

OpenCloud offers flexible options for data management in apps, from simple file-based approaches to complex external services. Choosing the right strategy depends on your specific requirements for complexity, performance, and scalability.

For most applications, the metadata-based approach with the PosixFS backend provides a good balance between simplicity and functionality. For more complex requirements, consider developing a specialized data service.

## Further Resources

- [Official OpenCloud Documentation](https://docs.opencloud.eu/)
- [Web App Skeleton Repository](https://github.com/opencloud-eu/web-app-skeleton)
- [Web Extensions Repository](https://github.com/opencloud-eu/web-extensions)