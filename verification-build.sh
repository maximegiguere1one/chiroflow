#!/bin/bash

echo "🧪 VÉRIFICATION COMPILATION - 4 NOUVELLES FONCTIONNALITÉS"
echo "=========================================================="
echo ""

echo "📦 1. Vérification fichiers créés..."
if [ -f "src/hooks/useVoiceRecognition.ts" ]; then
  echo "✅ useVoiceRecognition.ts"
else
  echo "❌ useVoiceRecognition.ts MANQUANT"
fi

if [ -f "src/components/common/VoiceInput.tsx" ]; then
  echo "✅ VoiceInput.tsx"
else
  echo "❌ VoiceInput.tsx MANQUANT"
fi

if [ -f "src/components/dashboard/QuickBillingModal.tsx" ]; then
  echo "✅ QuickBillingModal.tsx"
else
  echo "❌ QuickBillingModal.tsx MANQUANT"
fi

echo ""
echo "📝 2. Vérification modifications..."
grep -q "GlobalSearch" src/pages/AdminDashboard.tsx && echo "✅ GlobalSearch intégré" || echo "❌ GlobalSearch NON intégré"
grep -q "QuickBillingModal" src/components/dashboard/PatientListUltraClean.tsx && echo "✅ QuickBilling intégré" || echo "❌ QuickBilling NON intégré"
grep -q "VoiceInput" src/components/dashboard/UltraFastSoapNote.tsx && echo "✅ VoiceInput intégré" || echo "❌ VoiceInput NON intégré"
grep -q "handleDrop" src/components/dashboard/EnhancedCalendar.tsx && echo "✅ Drag&Drop présent" || echo "❌ Drag&Drop ABSENT"

echo ""
echo "🔨 3. Test compilation TypeScript..."
npm run typecheck 2>&1 | grep -q "error" && echo "❌ ERREURS TypeScript trouvées!" || echo "✅ TypeScript OK"

echo ""
echo "🏗️  4. Test build production..."
BUILD_OUTPUT=$(npm run build 2>&1)
if echo "$BUILD_OUTPUT" | grep -q "built in"; then
  BUILD_TIME=$(echo "$BUILD_OUTPUT" | grep "built in" | sed -n 's/.*built in \([0-9.]*s\).*/\1/p')
  echo "✅ Build réussi en $BUILD_TIME"
else
  echo "❌ Build ÉCHOUÉ"
  echo "$BUILD_OUTPUT" | tail -20
fi

echo ""
echo "📊 5. Taille bundle..."
if [ -d "dist" ]; then
  BUNDLE_SIZE=$(du -sh dist | cut -f1)
  echo "✅ Bundle: $BUNDLE_SIZE"
  
  LARGEST=$(find dist/assets -name "*.js" -type f -exec du -h {} + | sort -rh | head -3)
  echo ""
  echo "   Plus gros fichiers:"
  echo "$LARGEST" | while read size file; do
    echo "   - $(basename "$file"): $size"
  done
else
  echo "❌ Dossier dist/ introuvable"
fi

echo ""
echo "=========================================================="
echo "✅ VÉRIFICATION TERMINÉE"
echo ""
echo "Pour tester manuellement:"
echo "  npm run dev"
echo ""
echo "Puis suivre: GUIDE_TEST_COMPLET.md"
