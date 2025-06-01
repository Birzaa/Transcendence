all:
	@docker compose -f ./docker-compose.yml up
	# @docker compose -f ./docker-compose.yml up -d

down:
	docker compose -f docker-compose.yml down

clean:
	docker compose -f docker-compose.yml down

fclean: clean

re: fclean all

.PHONY: all re down clean fclean
