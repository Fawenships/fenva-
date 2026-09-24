# FENVA BEAUTY

**FENVA BEAUTY** est une plateforme e-commerce dédiée à la vente de produits cosmétiques et de beauté.

Le projet est conçu comme une application web complète avec un **frontend**, un **serveur backend** et une **base de données**, permettant de gérer les produits, les clients, les commandes et les différentes fonctionnalités de la boutique.

---

## Présentation

FENVA BEAUTY propose une expérience d'achat moderne, élégante et professionnelle pour les produits de beauté.

### Catégories principales

* Soins du visage
* Soins du corps
* Soins des cheveux
* Parfums
* Maquillage
* Accessoires beauté
* Nouveautés
* Promotions

---

## Architecture

Le projet repose sur trois parties principales :

```text
                    FENVA BEAUTY
                         │
             ┌───────────┴───────────┐
             │                       │
        FRONTEND                  BACKEND
             │                       │
       Interface client          Serveur API
             │                       │
             └───────────┬───────────┘
                         │
                    BASE DE DONNÉES
```

### Frontend

Le frontend constitue l'interface visible par les clients.

Il permet notamment de :

* consulter les produits
* parcourir les catégories
* rechercher des produits
* consulter les détails d'un produit
* ajouter des produits au panier
* gérer le panier
* passer une commande
* consulter les informations de la boutique

### Backend

Le serveur gère la logique de l'application et communique avec la base de données.

Il pourra notamment gérer :

* les produits
* les catégories
* les utilisateurs
* les clients
* les commandes
* les stocks
* les promotions
* les avis
* l'authentification
* l'administration
* les statistiques

Le frontend communique avec le serveur via une **API**.

### Base de données

La base de données permet de conserver les informations importantes de la boutique.

Exemples de données :

```text
Users
Products
Categories
Orders
Order Items
Customers
Reviews
Promotions
Inventory
```

---

## Fonctionnalités

### Boutique

* Catalogue de produits
* Catégories
* Recherche
* Filtres
* Fiches produits
* Prix
* Images
* Descriptions
* Disponibilité
* Nouveautés
* Promotions

### Panier

* Ajouter un produit
* Modifier la quantité
* Supprimer un produit
* Calcul automatique du total
* Vérification de la disponibilité

### Commandes

Le serveur permettra de gérer les commandes et leur évolution.

Exemple de statut :

```text
En attente
Confirmée
En préparation
Expédiée
Livrée
Annulée
```

### Comptes clients

Les utilisateurs pourront éventuellement disposer d'un compte permettant de :

* créer un compte
* se connecter
* modifier leurs informations
* consulter leurs commandes
* suivre leurs commandes

### Administration

Un espace administrateur permettra de gérer la boutique.

L'administrateur pourra notamment :

* ajouter des produits
* modifier des produits
* supprimer des produits
* gérer les catégories
* gérer les stocks
* consulter les commandes
* modifier le statut des commandes
* gérer les clients
* gérer les promotions
* consulter les statistiques

---

## Technologies

### Frontend

* HTML5
* CSS3
* JavaScript
* Responsive Design

### Backend

Le serveur pourra être développé avec :

* Node.js
* Express.js

### Base de données

Le projet utilisera une base de données relationnelle, par exemple :

* PostgreSQL

### API

La communication entre le frontend et le serveur se fera via une API REST.

Exemples :

```text
GET    /api/products
GET    /api/products/:id
POST   /api/products
PUT    /api/products/:id
DELETE /api/products/:id

GET    /api/categories
POST   /api/categories

GET    /api/orders
POST   /api/orders
PUT    /api/orders/:id

POST   /api/auth/register
POST   /api/auth/login
```

---

## Structure du projet

```text
FENVA-BEAUTY/
│
├── public/
│   ├── index.html
│   ├── produits.html
│   ├── categories.html
│   ├── panier.html
│   ├── contact.html
│   │
│   ├── css/
│   │   └── style.css
│   │
│   ├── js/
│   │   ├── app.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   └── auth.js
│   │
│   └── assets/
│       ├── images/
│       ├── logo/
│       └── icons/
│
├── server/
│   ├── server.js
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── config/
│
├── database/
│   ├── schema.sql
│   └── migrations/
│
├── admin/
│   ├── index.html
│   ├── products.html
│   ├── orders.html
│   ├── customers.html
│   └── dashboard.html
│
├── package.json
├── .env
├── .gitignore
└── README.md
```

---

## Sécurité

La partie serveur devra protéger les données de la boutique et des utilisateurs.

Le projet devra notamment utiliser :

* Variables d'environnement
* Authentification sécurisée
* Hashage des mots de passe
* Validation des données
* Protection des routes administrateur
* Contrôle des permissions
* Protection contre les requêtes malveillantes
* Séparation des données sensibles du frontend

Les informations sensibles ne doivent jamais être directement enregistrées dans le code source.

---

## Variables d'environnement

Les informations de configuration du serveur seront stockées dans un fichier `.env`.

Exemple :

```env
PORT=3000
DATABASE_URL=
JWT_SECRET=
NODE_ENV=production
```

Le fichier `.env` ne doit jamais être envoyé sur GitHub.

---

## Installation

Cloner le projet :

```bash
git clone <repository-url>
cd FENVA-BEAUTY
```

Installer les dépendances :

```bash
npm install
```

Configurer les variables d'environnement :

```bash
.env
```

Démarrer le serveur en développement :

```bash
npm run dev
```

Ou démarrer le serveur :

```bash
npm start
```

Le serveur pourra ensuite être accessible à :

```text
http://localhost:3000
```

---

## Déploiement

FENVA BEAUTY est prévu pour fonctionner avec une architecture serveur.

Le déploiement pourra comprendre :

```text
Frontend
    ↓
Serveur Backend
    ↓
API
    ↓
PostgreSQL
```

Le serveur devra rester connecté à la base de données afin que les produits, commandes, clients et autres informations soient persistants.

---

## Identité visuelle

### Nom

**FENVA BEAUTY**

### Direction artistique

* Moderne
* Élégante
* Minimaliste
* Premium
* Professionnelle
* Épurée

### Palette

La palette principale sera basée sur :

* Blanc cassé
* Crème
* Beige / nude
* Brun foncé
* Noir
* Touches dorées

Le design doit éviter les couleurs trop vives, notamment le bleu et le violet.

---

## Objectifs

Le projet a pour objectif de devenir une **véritable plateforme e-commerce de cosmétiques**, et pas uniquement une vitrine.

L'architecture serveur permettra progressivement d'intégrer :

* Gestion complète des produits
* Gestion des stocks
* Gestion des commandes
* Comptes clients
* Administration
* Paiements
* Notifications
* Avis clients
* Promotions
* Statistiques
* Gestion avancée de la boutique

---

## Évolution prévue

### Phase 1 — Boutique

* Design FENVA BEAUTY
* Catalogue
* Catégories
* Produits
* Panier
* Responsive design

### Phase 2 — Backend

* Serveur Node.js
* API REST
* Base de données PostgreSQL
* Gestion des produits
* Gestion des commandes

### Phase 3 — Administration

* Dashboard
* Produits
* Catégories
* Stocks
* Commandes
* Clients

### Phase 4 — E-commerce avancé

* Comptes clients
* Paiement en ligne
* Notifications
* Promotions
* Avis clients
* Statistiques

---

## Principe de développement

Les fonctionnalités existantes doivent être conservées lorsqu'elles restent pertinentes.

Les modifications doivent être réalisées progressivement afin d'éviter de casser le fonctionnement de l'application.

Le frontend, le backend et la base de données doivent rester clairement séparés afin de faciliter la maintenance et les évolutions futures.

---

## Auteur

**Fawenbert Régis**

Développeur & créateur de projets numériques.

---

## Licence

Projet propriétaire de **FENVA BEAUTY**.

Toute utilisation, reproduction ou modification du projet doit être autorisée par son propriétaire.
