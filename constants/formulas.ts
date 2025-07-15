
// Formules de calcul utilisées dans l'application
export const CALCULATION_FORMULAS = {
  // Calculs financiers
  PROFIT_MARGIN: 'Marge bénéficiaire = ((Prix de vente - Prix d\'achat) / Prix de vente) × 100',
  GROSS_PROFIT: 'Bénéfice brut = Prix de vente - Prix d\'achat',
  TAX_AMOUNT: 'Montant TVA = (Prix HT × Taux TVA) / 100',
  TOTAL_WITH_TAX: 'Prix TTC = Prix HT + Montant TVA',
  
  // Calculs de stock
  STOCK_VALUE: 'Valeur stock = Quantité × Prix d\'achat',
  TURNOVER_RATIO: 'Taux de rotation = Ventes annuelles / Stock moyen',
  REORDER_POINT: 'Point de commande = (Consommation moyenne × Délai) + Stock de sécurité',
  
  // Calculs de vente
  TOTAL_SALE: 'Total vente = Σ(Quantité × Prix unitaire)',
  DISCOUNT_AMOUNT: 'Montant remise = Prix original × (Pourcentage remise / 100)',
  FINAL_PRICE: 'Prix final = Prix original - Montant remise + TVA',
  
  // Analytics
  CONVERSION_RATE: 'Taux de conversion = (Ventes réalisées / Prospects) × 100',
  AVERAGE_ORDER_VALUE: 'Panier moyen = Chiffre d\'affaires total / Nombre de commandes',
  GROWTH_RATE: 'Taux de croissance = ((Valeur finale - Valeur initiale) / Valeur initiale) × 100'
};

export const BUSINESS_RULES = {
  MIN_PROFIT_MARGIN: 10, // 10% minimum
  MAX_DISCOUNT_RATE: 50, // 50% maximum
  LOW_STOCK_THRESHOLD: 5, // 5 unités minimum
  CRITICAL_STOCK_THRESHOLD: 0, // Rupture de stock
  DEFAULT_TAX_RATE: 20, // 20% TVA par défaut
  MAX_ITEMS_PER_SALE: 100 // 100 articles maximum par vente
};
