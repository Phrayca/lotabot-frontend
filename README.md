# Lotabot – Frontend

Application web (Next.js) pour **Lotabot**, robot de trading automatique XAUUSD.
Rebranding de la maquette "TradeBot Sénégal" fournie, connectée au backend `lotabot-backend`.

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS (thème sombre/doré identique à la maquette)

## Lancer en local

```bash
npm install
cp .env.local.example .env.local   # puis vérifier NEXT_PUBLIC_API_BASE
npm run dev
```

L'app tourne sur `http://localhost:3000`. Elle attend le backend sur `http://localhost:4000/api` par défaut (voir `lotabot-backend`).

Compte de démonstration : `771715238` / `demo1234`.

## Écrans

Connexion, inscription + choix de formule, connexion MT5, accueil (solde, robot, gains du jour), historique des trades, réglages du robot (risque/lot/positions), formation vidéo, profil, informations personnelles, abonnement et paiement (Orange Money / Wave), statut MT5, notifications, parrainage.

## Variables d'environnement

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE` | URL de base de l'API backend, ex: `https://api.lotabot.sn/api` en production. |

## Déploiement

Comme pour Lotafinance : déploiement sur **Vercel**, en définissant `NEXT_PUBLIC_API_BASE` vers l'URL du backend déployé sur Render.
