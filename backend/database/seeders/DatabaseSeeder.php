<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        foreach ([
            ['name' => 'The Weekend Tee', 'description' => 'A relaxed-fit cotton tee made for slow mornings and long weekends.', 'category' => 'Tops', 'price' => 890, 'image_url' => 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=85', 'stock' => 24, 'is_featured' => true],
            ['name' => 'Everyday Linen Shirt', 'description' => 'Airy, easy linen with a soft hand and an effortless drape.', 'category' => 'Tops', 'price' => 1490, 'image_url' => 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=85', 'stock' => 18, 'is_featured' => true],
            ['name' => 'Sunday Knit Sweater', 'description' => 'A lightweight knit you will reach for season after season.', 'category' => 'Knitwear', 'price' => 2190, 'image_url' => 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85', 'stock' => 12, 'is_featured' => false],
            ['name' => 'The Tailored Trouser', 'description' => 'A flattering, softly structured trouser that goes everywhere.', 'category' => 'Bottoms', 'price' => 1890, 'image_url' => 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=85', 'stock' => 16, 'is_featured' => true],
            ['name' => 'Cloud Nine Cardigan', 'description' => 'The coziest layer, knitted in a warm neutral shade.', 'category' => 'Knitwear', 'price' => 2390, 'image_url' => 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=85', 'stock' => 9, 'is_featured' => false],
            ['name' => 'Daylight Canvas Tote', 'description' => 'A generously sized everyday carryall in durable cotton canvas.', 'category' => 'Accessories', 'price' => 690, 'image_url' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=900&q=85', 'stock' => 30, 'is_featured' => false],
            ['name' => 'Soft Focus Midi Dress', 'description' => 'A breezy, easy-to-style dress made for wherever the day goes.', 'category' => 'Dresses', 'price' => 1990, 'image_url' => 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=900&q=85', 'stock' => 14, 'is_featured' => true],
            ['name' => 'Weekend Denim', 'description' => 'Your favorite straight-leg fit, cut in perfectly lived-in denim.', 'category' => 'Bottoms', 'price' => 1790, 'image_url' => 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=85', 'stock' => 20, 'is_featured' => false],
            ['name' => 'Ribbed Everyday Tank', 'description' => 'A soft, stretchy ribbed essential for warm days and easy layering.', 'category' => 'Tops', 'price' => 590, 'image_url' => 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=900&q=85', 'stock' => 26, 'is_featured' => true],
            ['name' => 'Sunday Cotton Blouse', 'description' => 'A relaxed cotton blouse with a little extra room to breathe.', 'category' => 'Tops', 'price' => 1290, 'image_url' => 'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=85', 'stock' => 17, 'is_featured' => true],
            ['name' => 'Easy Day Linen Shorts', 'description' => 'Lightweight linen shorts with an easy fit and an elastic waist.', 'category' => 'Bottoms', 'price' => 1090, 'image_url' => 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=900&q=85', 'stock' => 21, 'is_featured' => true],
            ['name' => 'After Hours Wrap Dress', 'description' => 'A flattering wrap silhouette that moves from daytime to dinner.', 'category' => 'Dresses', 'price' => 2290, 'image_url' => 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=85', 'stock' => 11, 'is_featured' => true],
            ['name' => 'The Easy Layer Jacket', 'description' => 'A softly structured jacket for breezy afternoons and cool evenings.', 'category' => 'Outerwear', 'price' => 2690, 'image_url' => 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85', 'stock' => 8, 'is_featured' => false],
            ['name' => 'Soft Rib Lounge Set', 'description' => 'A matching, feel-good knit set for slow starts and quiet evenings.', 'category' => 'Loungewear', 'price' => 1890, 'image_url' => 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85', 'stock' => 13, 'is_featured' => false],
            ['name' => 'Little Things Crossbody', 'description' => 'A compact everyday bag with room for all the essentials.', 'category' => 'Accessories', 'price' => 1190, 'image_url' => 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85', 'stock' => 15, 'is_featured' => true],
            ['name' => 'The Weekend Bucket Hat', 'description' => 'A lightweight cotton hat for sunny walks and weekend plans.', 'category' => 'Accessories', 'price' => 490, 'image_url' => 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=900&q=85', 'stock' => 22, 'is_featured' => false],
            ['name' => 'The Boxy Everyday Tee', 'description' => 'A slightly oversized cotton tee with a soft feel and easy drape.', 'category' => 'Tops', 'price' => 790, 'image_url' => 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?auto=format&fit=crop&w=900&q=85', 'stock' => 25, 'is_featured' => true],
            ['name' => 'Open Air Poplin Shirt', 'description' => 'Crisp cotton poplin, relaxed through the body and ready to layer.', 'category' => 'Tops', 'price' => 1390, 'image_url' => 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=900&q=85', 'stock' => 15, 'is_featured' => false],
            ['name' => 'Soft Pleat Wide-Leg Pants', 'description' => 'An easy wide-leg silhouette with soft pleats and a comfortable waist.', 'category' => 'Bottoms', 'price' => 1690, 'image_url' => 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?auto=format&fit=crop&w=900&q=85', 'stock' => 14, 'is_featured' => true],
            ['name' => 'The Everyday Denim Skirt', 'description' => 'A timeless mid-length denim skirt made for everyday outfits.', 'category' => 'Bottoms', 'price' => 1490, 'image_url' => 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=900&q=85', 'stock' => 12, 'is_featured' => false],
            ['name' => 'Golden Hour Slip Dress', 'description' => 'A simple, fluid slip dress that makes getting dressed feel effortless.', 'category' => 'Dresses', 'price' => 2090, 'image_url' => 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=900&q=85', 'stock' => 10, 'is_featured' => true],
            ['name' => 'The Little Knit Vest', 'description' => 'A light layer in a soft knit, easy over a tee or on its own.', 'category' => 'Knitwear', 'price' => 1190, 'image_url' => 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=85', 'stock' => 13, 'is_featured' => false],
            ['name' => 'Cloud Walk Zip Hoodie', 'description' => 'A soft, midweight hoodie for travel days and slow weekends.', 'category' => 'Loungewear', 'price' => 1590, 'image_url' => 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=85', 'stock' => 19, 'is_featured' => true],
            ['name' => 'The Every Day Shoulder Bag', 'description' => 'A versatile shoulder bag with plenty of room for your daily essentials.', 'category' => 'Accessories', 'price' => 1390, 'image_url' => 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85', 'stock' => 11, 'is_featured' => true],
            ['name' => 'Sunday Market Scarf', 'description' => 'A lightweight printed scarf to tie, wrap, or wear your own way.', 'category' => 'Accessories', 'price' => 590, 'image_url' => 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=900&q=85', 'stock' => 20, 'is_featured' => false],
        ] as $product) {
            Product::updateOrCreate(['name' => $product['name']], $product);
        }

        if (env('ADMIN_EMAIL') && env('ADMIN_PASSWORD')) {
            User::updateOrCreate(
                ['email' => env('ADMIN_EMAIL')],
                ['name' => 'Master Shop Admin', 'password' => Hash::make(env('ADMIN_PASSWORD')), 'role' => 'admin'],
            );
        }
    }
}
