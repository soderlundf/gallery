# Gallery

Working name is currently `Gallery`.

## Overview

* Indexer
* Thumbnail Generator
* Viewer

# Indexer

The indexer scans all folders from the specified start path searching for all files ending in the specified file extension(s) and stores metadata about the files in a database.

## Features

* Searches for files matching specified file extension(s).
* Searches for files starting at the specified start path.
* Stores file metadata in a database.
* Stores executed indexing jobs and their status in the database.
* Supports specifying settings in a configuration file.
* Exposes Swagger api docs.

## Database

Currently only PostgreSQL is supported.

# Thumbnail generator

This project has not be started.

# Viewer

This project has not be started.

# Getting started

1. Install a PostgreSQL database.
1. Create a database to house the index.
1. Create a user and set a password with access to the database.
1. Create the `/mnt/source_files` path and mount it.
1. Pull and run the Docker image from https://hub.docker.com/r/soderlundf/gallery
