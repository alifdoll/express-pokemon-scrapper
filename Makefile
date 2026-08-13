CONTAINER_NAME=pokemon-scrap

setup:
	@if [ -z "$(CONTAINER_NAME)" ]; then \
			echo "CONTAINER_NAME is empty."; \
			exit 1; \
		fi
	@make build
	@make up
	@make give-permission

start-db:
	docker compose --project-name 'postgre_and_pgadmin' start && \
	docker compose --project-name 'mysql_and_phpmyadmin' stop 

build: 
	docker compose build

up:
	pnpm run dev
# 	docker compose up -d
	docker compose up -d

stop:
	docker-compose stop

exec:
	docker exec  -it $(CONTAINER_NAME) sh

give-permission:
	docker exec $(CONTAINER_NAME) sh -c "chmod -R ugo+rw /usr/src/app/"


pnpm-install:
	docker exec $(CONTAINER_NAME) sh -c "pnpm install"

delete:
	@make stop
	@make delete-container
	@make delete-image

delete-container:
	docker rm $(CONTAINER_NAME)

delete-image:
	docker rmi $(CONTAINER_NAME)-laravel

stop-all:
	docker stop $$(docker ps -q)

create-branch:
	git checkout -b dev origin/typescript