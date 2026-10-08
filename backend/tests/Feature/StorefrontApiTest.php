<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class StorefrontApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_can_register_and_sign_in(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Casey Customer',
            'email' => 'casey@example.com',
            'password' => 'a-strong-password',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.role', 'customer')
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);

        $this->postJson('/api/login', [
            'email' => 'casey@example.com',
            'password' => 'a-strong-password',
        ])->assertOk()->assertJsonPath('user.email', 'casey@example.com');
    }

    public function test_signing_in_again_does_not_invalidate_other_sessions_and_logout_is_per_session(): void
    {
        $admin = $this->makeUser('admin', 'admin@example.com');
        $credentials = ['email' => 'admin@example.com', 'password' => 'a-strong-password'];
        $firstToken = $this->postJson('/api/login', $credentials)->assertOk()->json('token');
        $secondToken = $this->postJson('/api/login', $credentials)->assertOk()->json('token');

        $this->withToken($firstToken)->getJson('/api/admins')->assertOk();
        $this->withToken($secondToken)->getJson('/api/admins')->assertOk();

        $this->withToken($firstToken)->postJson('/api/logout')->assertOk();
        $this->withToken($firstToken)->getJson('/api/admins')->assertUnauthorized();
        $this->withToken($secondToken)->getJson('/api/admins')->assertOk();
    }

    public function test_only_an_admin_can_create_update_and_delete_products(): void
    {
        $admin = $this->makeUser('admin', 'admin@example.com');
        $customer = $this->makeUser('customer', 'customer@example.com');

        $this->withToken($customer['token'])->postJson('/api/products', $this->productData())->assertForbidden();

        $created = $this->withToken($admin['token'])
            ->postJson('/api/products', $this->productData())
            ->assertCreated()
            ->assertJsonPath('name', 'Everyday Shirt')
            ->json('id');

        $this->withToken($admin['token'])
            ->putJson("/api/products/{$created}", [
                ...$this->productData(),
                'name' => 'Updated Shirt',
                'description' => 'A new product description.',
                'category' => 'Accessories',
                'price' => 1500,
                'image_url' => 'https://images.example.com/updated-shirt.jpg',
                'stock' => 12,
                'is_featured' => false,
            ])
            ->assertOk()
            ->assertJsonPath('name', 'Updated Shirt')
            ->assertJsonPath('description', 'A new product description.')
            ->assertJsonPath('category', 'Accessories')
            ->assertJsonPath('price', '1500.00')
            ->assertJsonPath('image_url', 'https://images.example.com/updated-shirt.jpg')
            ->assertJsonPath('stock', 12)
            ->assertJsonPath('is_featured', false);

        $this->assertDatabaseHas('products', [
            'id' => $created,
            'name' => 'Updated Shirt',
            'description' => 'A new product description.',
            'category' => 'Accessories',
            'price' => 1500,
            'image_url' => 'https://images.example.com/updated-shirt.jpg',
            'stock' => 12,
            'is_featured' => false,
        ]);

        $this->withToken($admin['token'])->deleteJson("/api/products/{$created}")->assertOk();
        $this->assertDatabaseMissing('products', ['id' => $created]);
    }

    public function test_database_seeder_loads_the_catalogue_without_duplicates(): void
    {
        $this->seed();
        $this->assertDatabaseCount('products', 25);

        $this->seed();
        $this->assertDatabaseCount('products', 25);
    }

    public function test_admin_can_create_list_and_delete_customer_accounts_without_deleting_orders(): void
    {
        $admin = $this->makeUser('admin', 'admin@example.com');
        $customer = User::create([
            'name' => 'Existing Customer',
            'email' => 'existing@example.com',
            'password' => 'a-strong-password',
            'role' => 'customer',
        ]);
        $order = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'MS-KEEP123',
            'contact_name' => 'Existing Customer',
            'phone_number' => '+639171234567',
            'total' => 900,
            'status' => 'processing',
            'payment_method' => 'cash',
            'payment_status' => 'pending',
            'shipping_address' => '123 Example Street, Manila',
        ]);

        $this->withToken($admin['token'])->postJson('/api/customers', [
            'name' => 'New Customer',
            'email' => 'new@example.com',
            'password' => 'a-strong-password',
        ])->assertCreated()->assertJsonPath('name', 'New Customer');

        $this->withToken($admin['token'])->getJson('/api/customers')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['email' => 'existing@example.com', 'orders_count' => 1])
            ->assertJsonFragment(['email' => 'new@example.com', 'orders_count' => 0]);

        $this->withToken($admin['token'])->deleteJson("/api/customers/{$customer->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Customer account deleted. Existing orders have been preserved.');

        $this->assertDatabaseMissing('users', ['id' => $customer->id]);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'user_id' => null, 'order_number' => 'MS-KEEP123']);

        $this->withToken($admin['token'])->deleteJson("/api/customers/{$admin['id']}")->assertNotFound();
    }

    public function test_customer_cannot_manage_customer_accounts(): void
    {
        $customer = $this->makeUser('customer', 'customer@example.com');

        $this->withToken($customer['token'])->getJson('/api/customers')->assertForbidden();
        $this->withToken($customer['token'])->postJson('/api/customers', [
            'name' => 'Another Customer',
            'email' => 'another@example.com',
            'password' => 'a-strong-password',
        ])->assertForbidden();
        $this->withToken($customer['token'])->deleteJson('/api/customers/'.$customer['id'])->assertForbidden();

        $this->assertDatabaseCount('users', 1);
    }

    public function test_admin_can_create_and_list_admin_accounts(): void
    {
        $admin = $this->makeUser('admin', 'admin@example.com');

        $created = $this->withToken($admin['token'])->postJson('/api/admins', [
            'name' => 'Store Manager',
            'email' => 'manager@example.com',
            'password' => 'a-strong-password',
        ])->assertCreated()
            ->assertJsonPath('name', 'Store Manager')
            ->assertJsonPath('email', 'manager@example.com')
            ->assertJsonMissingPath('password')
            ->assertJsonMissingPath('api_token');

        $this->assertDatabaseHas('users', [
            'email' => 'manager@example.com',
            'role' => 'admin',
            'api_token' => null,
        ]);
        $this->assertDatabaseMissing('users', [
            'email' => 'manager@example.com',
            'password' => 'a-strong-password',
        ]);

        $this->withToken($admin['token'])->getJson('/api/admins')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonFragment(['email' => 'admin@example.com', 'name' => 'Admin'])
            ->assertJsonFragment(['email' => 'manager@example.com', 'name' => 'Store Manager']);

        $this->withToken($admin['token'])->postJson('/api/admins', [
            'name' => 'Duplicate Admin',
            'email' => 'manager@example.com',
            'password' => 'a-strong-password',
        ])->assertUnprocessable();
    }

    public function test_customer_cannot_create_or_list_admin_accounts(): void
    {
        $customer = $this->makeUser('customer', 'customer@example.com');

        $this->withToken($customer['token'])->getJson('/api/admins')->assertForbidden();
        $this->withToken($customer['token'])->postJson('/api/admins', [
            'name' => 'Unauthorized Admin',
            'email' => 'unauthorized@example.com',
            'password' => 'a-strong-password',
        ])->assertForbidden();
        $this->assertDatabaseMissing('users', ['email' => 'unauthorized@example.com']);
    }

    public function test_customer_can_place_a_cash_order_using_database_prices_and_stock(): void
    {
        $customer = $this->makeUser('customer', 'buyer@example.com');
        $product = Product::create($this->productData(['price' => 1250, 'stock' => 4]));

        $this->withToken($customer['token'])->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'payment_method' => 'cash',
            'contact_name' => 'Casey Buyer',
            'phone_number' => '+639171234567',
            'shipping_address' => '123 Example Street, Manila',
        ])->assertCreated()
            ->assertJsonPath('order.total', '2500.00')
            ->assertJsonPath('order.payment_status', 'pending')
            ->assertJsonPath('order.items.0.quantity', 2)
            ->assertJsonPath('order.contact_name', 'Casey Buyer')
            ->assertJsonPath('order.phone_number', '+639171234567')
            ->assertJsonPath('order.shipping_address', '123 Example Street, Manila');

        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 2]);
        $this->withToken($customer['token'])->getJson('/api/orders')->assertOk()->assertJsonCount(1);
    }

    public function test_customer_cannot_order_more_than_available_stock(): void
    {
        $customer = $this->makeUser('customer', 'buyer@example.com');
        $product = Product::create($this->productData(['stock' => 1]));

        $this->withToken($customer['token'])->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 2]],
            'payment_method' => 'cash',
            'contact_name' => 'Casey Buyer',
            'phone_number' => '+639171234567',
            'shipping_address' => '123 Example Street, Manila',
        ])->assertUnprocessable();

        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 1]);
    }

    public function test_paymongo_checkout_uses_server_side_order_total(): void
    {
        config(['services.paymongo.secret_key' => 'sk_test_example']);
        Http::fake([
            'https://api.paymongo.com/v1/checkout_sessions' => Http::response([
                'data' => [
                    'id' => 'cs_test_example',
                    'attributes' => ['checkout_url' => 'https://checkout.paymongo.com/example'],
                ],
            ]),
        ]);

        $customer = $this->makeUser('customer', 'buyer@example.com');
        $product = Product::create($this->productData(['price' => 450, 'stock' => 3]));

        $this->withToken($customer['token'])->postJson('/api/orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'payment_method' => 'paymongo',
            'contact_name' => 'Casey Buyer',
            'phone_number' => '+639171234567',
            'shipping_address' => '123 Example Street, Manila',
        ])->assertCreated()
            ->assertJsonPath('checkout_url', 'https://checkout.paymongo.com/example')
            ->assertJsonPath('order.paymongo_checkout_id', 'cs_test_example');

        Http::assertSent(fn ($request) => $request->url() === 'https://api.paymongo.com/v1/checkout_sessions'
            && $request['data']['attributes']['line_items'][0]['amount'] === 45000);
    }

    private function makeUser(string $role, string $email): array
    {
        $token = str_repeat($role === 'admin' ? 'a' : 'c', 64);
        $user = User::create([
            'name' => ucfirst($role),
            'email' => $email,
            'password' => 'a-strong-password',
            'role' => $role,
            'api_token' => hash('sha256', $token),
        ]);

        return ['token' => $token, 'id' => $user->id];
    }

    private function productData(array $overrides = []): array
    {
        return array_replace([
            'name' => 'Everyday Shirt',
            'description' => 'An easy everyday favorite.',
            'category' => 'Tops',
            'price' => 890,
            'image_url' => 'https://images.example.com/shirt.jpg',
            'stock' => 8,
            'is_featured' => true,
        ], $overrides);
    }
}
