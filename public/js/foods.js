// Food library + Open Food Facts lookups.
// Built-in values are per 100 g and are typical estimates. Packaged foods: scan the barcode instead.

const F = (id, name, kcal, protein, carbs, fat, units = [], tags = '') => ({
  id: 'b_' + id, name, kcal, protein, carbs, fat, units, tags, source: 'builtin',
});
const u = (label, g) => ({ label, g });

export const BUILTIN_FOODS = [
  // Kerala and South Indian
  F('puttu', 'Puttu (rice)', 200, 3.5, 38, 3.5, [u('1 piece', 100)], 'kerala breakfast'),
  F('appam', 'Appam', 200, 3.5, 38, 3, [u('1 appam', 60)], 'kerala breakfast'),
  F('idiyappam', 'Idiyappam', 150, 2.5, 33, 0.5, [u('1 piece', 35)], 'kerala breakfast string hoppers'),
  F('kadala', 'Kadala curry', 140, 7, 16, 5.5, [u('1 bowl', 150)], 'kerala chickpea black chana'),
  F('porotta', 'Porotta / parotta', 330, 7, 45, 13, [u('1 porotta', 80)], 'kerala malabar'),
  F('beeffry', 'Beef fry (Kerala)', 250, 24, 5, 15, [u('1 serving', 120)], 'kerala beef ularthiyathu'),
  F('fishcurry', 'Fish curry', 110, 13, 3, 5, [u('1 bowl', 150)], 'kerala meen'),
  F('fishfry', 'Fish fry (sardine / mackerel)', 220, 20, 5, 13, [u('1 piece', 70)], 'kerala meen varuthathu mathi ayala'),
  F('chickencurry', 'Chicken curry', 150, 14, 4, 9, [u('1 bowl', 180)], 'kozhi'),
  F('eggcurry', 'Egg curry', 140, 8, 4, 10, [u('1 bowl', 180)], 'mutta'),
  F('sambar', 'Sambar', 50, 2.5, 7, 1.5, [u('1 bowl', 150)], 'south indian'),
  F('avial', 'Avial', 110, 2.5, 9, 7, [u('1 serving', 100)], 'kerala sadya'),
  F('thoran', 'Thoran (vegetable)', 90, 2, 8, 6, [u('1 serving', 100)], 'kerala cabbage beans'),
  F('mattarice', 'Kerala matta rice, cooked', 120, 2.5, 26, 0.4, [u('1 cup', 160), u('1 plate', 300)], 'rice red rose'),
  F('kappa', 'Tapioca (kappa), boiled', 160, 1.4, 38, 0.3, [u('1 serving', 200)], 'kerala cassava'),
  F('idli', 'Idli', 145, 4.5, 30, 0.4, [u('1 idli', 40)], 'south indian breakfast'),
  F('dosa', 'Dosa, plain', 170, 4, 28, 4.5, [u('1 dosa', 80)], 'south indian breakfast'),
  F('vada', 'Uzhunnu vada', 290, 9, 30, 16, [u('1 vada', 50)], 'medu vada snack'),
  F('pazhampori', 'Pazham pori', 280, 3.5, 40, 12, [u('1 piece', 70)], 'banana fritter snack'),
  F('nendran', 'Nendran banana, ripe', 110, 1.3, 28, 0.2, [u('1 banana', 150)], 'kerala plantain'),
  F('upma', 'Upma', 135, 3.5, 20, 4.5, [u('1 plate', 200)], 'breakfast rava'),
  F('poha', 'Poha', 130, 2.6, 23, 3, [u('1 plate', 180)], 'breakfast'),
  F('biryani', 'Chicken biryani', 190, 9, 22, 7, [u('1 plate', 350)], 'rice'),
  F('friedrice', 'Chicken fried rice', 175, 7, 24, 6, [u('1 plate', 300)], 'rice'),
  F('samosa', 'Samosa', 308, 5, 32, 18, [u('1 samosa', 60)], 'snack'),
  // Staples
  F('rice', 'White rice, cooked', 130, 2.7, 28, 0.3, [u('1 cup', 160), u('1 plate', 300)], 'rice'),
  F('chapati', 'Chapati / roti', 297, 9.8, 49, 7.5, [u('1 chapati', 40)], 'wheat'),
  F('dal', 'Dal, cooked', 110, 6, 14, 3.5, [u('1 bowl', 150)], 'lentil parippu'),
  F('rajma', 'Rajma curry', 120, 6, 15, 4, [u('1 bowl', 150)], 'kidney beans'),
  F('oats', 'Oats, dry', 389, 17, 66, 7, [u('1/2 cup', 40)], 'breakfast'),
  F('bread', 'White bread', 265, 9, 49, 3.2, [u('1 slice', 25)], ''),
  F('brownbread', 'Brown bread', 250, 10, 43, 4, [u('1 slice', 28)], 'wheat'),
  F('potato', 'Potato, boiled', 87, 1.9, 20, 0.1, [u('1 medium', 150)], ''),
  F('sweetpotato', 'Sweet potato, boiled', 86, 1.6, 20, 0.1, [u('1 medium', 150)], ''),
  // Protein
  F('chickenbreast', 'Chicken breast, cooked', 165, 31, 0, 3.6, [u('1 breast', 150)], 'protein'),
  F('chicken65', 'Fried chicken / chicken 65', 260, 20, 10, 16, [u('1 serving', 150)], ''),
  F('egg', 'Egg, whole', 155, 13, 1.1, 11, [u('1 egg', 50)], 'protein mutta boiled'),
  F('eggwhite', 'Egg white', 52, 11, 0.7, 0.2, [u('1 white', 33)], 'protein'),
  F('omelette', 'Omelette', 170, 11.5, 1.5, 13, [u('2-egg omelette', 120)], 'egg'),
  F('paneer', 'Paneer', 265, 18, 3, 20, [u('1 cube piece', 25), u('1 serving', 100)], 'protein cottage cheese'),
  F('soya', 'Soya chunks, dry', 345, 52, 33, 0.5, [u('1 serving', 50)], 'protein vegetarian'),
  F('tuna', 'Tuna, canned in water', 116, 26, 0, 1, [u('1 can', 120)], 'protein fish'),
  F('whey', 'Whey protein', 400, 80, 8, 6, [u('1 scoop', 30)], 'protein shake supplement'),
  F('sprouts', 'Moong sprouts', 30, 3, 6, 0.2, [u('1 cup', 100)], 'protein'),
  // Dairy
  F('milk', 'Milk, toned', 58, 3.1, 4.7, 3, [u('1 glass', 250)], 'dairy'),
  F('curd', 'Curd / yogurt', 60, 3.5, 4.7, 3.3, [u('1 bowl', 150)], 'dairy thairu'),
  F('greekyogurt', 'Greek yogurt, plain', 59, 10, 3.6, 0.4, [u('1 cup', 170)], 'dairy'),
  F('tea', 'Tea with milk and sugar', 45, 1.5, 7, 1.4, [u('1 cup', 150)], 'chaya'),
  F('coffee', 'Coffee with milk and sugar', 45, 1.5, 7, 1.4, [u('1 cup', 150)], ''),
  // Fruit, nuts, fats
  F('banana', 'Banana', 89, 1.1, 23, 0.3, [u('1 medium', 118)], 'fruit'),
  F('apple', 'Apple', 52, 0.3, 14, 0.2, [u('1 medium', 180)], 'fruit'),
  F('mango', 'Mango', 60, 0.8, 15, 0.4, [u('1 cup', 165)], 'fruit'),
  F('papaya', 'Papaya', 43, 0.5, 11, 0.3, [u('1 cup', 145)], 'fruit'),
  F('orange', 'Orange', 47, 0.9, 12, 0.1, [u('1 medium', 130)], 'fruit'),
  F('watermelon', 'Watermelon', 30, 0.6, 8, 0.2, [u('1 cup', 150)], 'fruit'),
  F('dates', 'Dates', 282, 2.5, 75, 0.4, [u('1 date', 8)], 'fruit'),
  F('almonds', 'Almonds', 579, 21, 22, 50, [u('10 almonds', 12)], 'nuts'),
  F('peanuts', 'Peanuts, roasted', 567, 26, 16, 49, [u('1 handful', 30)], 'nuts'),
  F('pb', 'Peanut butter', 588, 25, 20, 50, [u('1 tbsp', 16)], 'nuts'),
  F('coconut', 'Coconut, fresh grated', 354, 3.3, 15, 33, [u('2 tbsp', 20)], 'kerala'),
  F('ghee', 'Ghee', 900, 0, 0, 100, [u('1 tsp', 5)], 'fat'),
  F('oil', 'Cooking oil', 884, 0, 0, 100, [u('1 tsp', 5), u('1 tbsp', 14)], 'fat coconut oil'),
  F('sugar', 'Sugar', 387, 0, 100, 0, [u('1 tsp', 4)], ''),
];

export function scaleFood(food, grams) {
  const k = grams / 100;
  const r = (v) => Math.round(v * k * 10) / 10;
  return { kcal: Math.round(food.kcal * k), protein: r(food.protein), carbs: r(food.carbs), fat: r(food.fat) };
}

export function searchLocal(query, customFoods) {
  const q = query.trim().toLowerCase();
  const all = [...customFoods, ...BUILTIN_FOODS];
  if (!q) return all.slice(0, 30);
  const words = q.split(/\s+/);
  return all
    .map((f) => {
      const hay = `${f.name} ${f.brand || ''} ${f.tags || ''}`.toLowerCase();
      if (!words.every((w) => hay.includes(w))) return null;
      const score = f.name.toLowerCase().startsWith(q) ? 0 : f.name.toLowerCase().includes(q) ? 1 : 2;
      return { f, score };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score)
    .slice(0, 40)
    .map((x) => x.f);
}

// ---------- Open Food Facts ----------
const OFF_FIELDS = 'code,product_name,product_name_en,brands,nutriments,serving_quantity,serving_size,image_front_small_url';

function offToFood(p) {
  if (!p) return null;
  const n = p.nutriments || {};
  let kcal = n['energy-kcal_100g'];
  if (kcal == null && n.energy_100g != null) kcal = n.energy_100g / 4.184; // kJ -> kcal
  const protein = n.proteins_100g;
  const carbs = n.carbohydrates_100g;
  const fat = n.fat_100g;
  const name = (p.product_name_en || p.product_name || '').trim();
  const hasData = [kcal, protein, carbs, fat].some((v) => v != null && v !== '');
  const servingG = Number(p.serving_quantity) || null;
  return {
    id: 'off_' + p.code,
    barcode: p.code,
    name: name || 'Unnamed product',
    brand: (p.brands || '').split(',')[0].trim(),
    kcal: Math.round(Number(kcal) || 0),
    protein: Math.round((Number(protein) || 0) * 10) / 10,
    carbs: Math.round((Number(carbs) || 0) * 10) / 10,
    fat: Math.round((Number(fat) || 0) * 10) / 10,
    units: servingG ? [{ label: `1 serving${p.serving_size ? ` (${p.serving_size})` : ''}`, g: servingG }] : [],
    image: p.image_front_small_url || '',
    source: 'off',
    incomplete: !hasData || !name,
  };
}

export async function lookupBarcode(code) {
  const clean = String(code).replace(/\D/g, '');
  if (!clean) throw new Error('That barcode has no digits.');
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${clean}.json?fields=${OFF_FIELDS}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Open Food Facts is not responding (${res.status}).`);
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return offToFood({ ...data.product, code: data.product.code || clean });
}

export async function searchOff(query) {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=${OFF_FIELDS}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open Food Facts search failed (${res.status}). It allows about 10 searches a minute.`);
  const data = await res.json();
  return (data.products || []).map(offToFood).filter((f) => f && !f.incomplete);
}
