##NodeJS Elasticsearch Repo

### first, run the command, npm install in root directory;

### then, run docker-compose up to start elasticsearch and if we got any error of virtual memory, try this command `sudo sysctl -w vm.max_map_count=262144` and then again run `docker-compose up`

### here we have the following end-points
    - create job
    - get job by id
    - update job by id
    - delete job by id
    - and last one is to fetch/search multiple records with pagination query params# elasticsearch-node
