NAME = ft_transcendence

# Couleurs pour un affichage sympa
GREEN = \033[0;32m
NC = \033[0m

all: up

build:
	@echo "$(GREEN)🛠️  Build de l'image Docker...$(NC)"
	docker-compose build

up:
	@echo "$(GREEN)🚀 Lancement de l'application...$(NC)"
	docker-compose up

down:
	@echo "$(GREEN)🛑 Arrêt des containers...$(NC)"
	docker-compose down

re: down build up

logs:
	@echo "$(GREEN)📋 Logs des containers...$(NC)"
	docker-compose logs -f

clean:
	@echo "$(GREEN)🧹 Suppression des containers/images...$(NC)"
	docker-compose down --rmi all --volumes --remove-orphans

.PHONY: all build up down re logs clean
