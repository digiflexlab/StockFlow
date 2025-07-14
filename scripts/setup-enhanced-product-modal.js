#!/usr/bin/env node

/**
 * Script de configuration rapide pour ProductModalEnhanced
 * Vérifie et configure les dépendances nécessaires
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Configuration du ProductModalEnhanced...\n');

// Vérification des fichiers requis
const requiredFiles = [
  'src/types/units.ts',
  'src/types/products.ts',
  'src/hooks/useUnits.tsx',
  'src/components/modals/ProductModalEnhanced.tsx',
  'src/hooks/useProductMutations.tsx',
  'src/services/productValidation.ts',
  'src/components/common/BarcodeGenerator.tsx',
  'src/components/common/MarginCalculator.tsx',
  'src/components/test/ProductModalTest.tsx',
  'supabase/migrations/20241210000000-extend-products-table.sql'
];

console.log('📋 Vérification des fichiers...');

let allFilesExist = true;
requiredFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MANQUANT`);
    allFilesExist = false;
  }
});

console.log('\n');

if (!allFilesExist) {
  console.log('⚠️  Certains fichiers sont manquants. Veuillez les créer avant de continuer.');
  process.exit(1);
}

// Vérification des dépendances
console.log('📦 Vérification des dépendances...');

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  '@tanstack/react-query',
  '@supabase/supabase-js',
  'lucide-react',
  'react-hook-form',
  'zod'
];

requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
    console.log(`✅ ${dep}`);
  } else {
    console.log(`❌ ${dep} - MANQUANT`);
  }
});

console.log('\n');

// Instructions de configuration
console.log('📝 Instructions de configuration :\n');

console.log('1. Base de données :');
console.log('   - Exécutez la migration : supabase/migrations/20241210000000-extend-products-table.sql');
console.log('   - Ou utilisez Supabase Cloud pour appliquer les changements\n');

console.log('2. Test du composant :');
console.log('   - Importez ProductModalTest dans une page de test');
console.log('   - Ou utilisez directement ProductModalEnhanced dans Products.tsx\n');

console.log('3. Configuration des hooks :');
console.log('   - Assurez-vous que useUnits est configuré');
console.log('   - Vérifiez que useProducts inclut les relations units\n');

console.log('4. Validation :');
console.log('   - Testez la création d\'un nouveau produit');
console.log('   - Testez l\'édition du produit "Huile palmiste"');
console.log('   - Vérifiez les calculs automatiques\n');

console.log('🎯 Scénario de test "Huile palmiste" :');
console.log('   - Nom: Huile palmiste');
console.log('   - SKU: HUILE-PALM-001');
console.log('   - Code barre: 6123456789012');
console.log('   - Unité: Bidon de 25L');
console.log('   - Prix d\'achat: 15,000 FCFA');
console.log('   - Prix de vente: 20,000 FCFA');
console.log('   - Taxe: 18%');
console.log('   - Magasins: [1, 2]\n');

console.log('✅ Configuration terminée !');
console.log('🚀 Vous pouvez maintenant utiliser le ProductModalEnhanced.'); 