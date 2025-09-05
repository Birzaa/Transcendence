NAME = ft_transcendence

# Couleurs pour un affichage sympa
GREEN = \033[0;32m
YELLOW = \033[1;33m
RED = \033[0;31m
NC = \033[0m

# Dossier des certificats
CERTS_DIR = certs
CERT_FILE = $(CERTS_DIR)/cert.pem
KEY_FILE = $(CERTS_DIR)/key.pem

all: certs up

# Génération des certificats auto-signés
certs:
	@echo "$(YELLOW)🔐 Vérification des certificats SSL...$(NC)"
	@if [ ! -f $(CERT_FILE) ] || [ ! -f $(KEY_FILE) ]; then \
		echo "$(YELLOW)📝 Génération de certificats auto-signés...$(NC)"; \
		mkdir -p $(CERTS_DIR); \
		openssl req -x509 -newkey rsa:4096 -keyout $(KEY_FILE) -out $(CERT_FILE) -days 365 -nodes -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=Transcendence/CN=localhost"; \
		echo "$(GREEN)✅ Certificats générés dans $(CERTS_DIR)/$(NC)"; \
	else \
		echo "$(GREEN)✅ Certificats déjà présents$(NC)"; \
	fi

build: certs
	@echo "$(GREEN)🛠️  Build de l'image Docker...$(NC)"
	docker-compose build

up: certs
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

clean-certs:
	@echo "$(YELLOW)🧹 Nettoyage des certificats...$(NC)"
	rm -rf $(CERTS_DIR)/*.pem
	@echo "$(GREEN)✅ Certificats supprimés$(NC)"

fclean: clean clean-certs
	@echo "$(GREEN)✨ Nettoyage complet effectué$(NC)"

.PHONY: all certs build up down re logs clean clean-certs fclean