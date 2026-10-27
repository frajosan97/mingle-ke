<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('coin_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20)->default('purchase');
            $table->string('status', 20)->default('pending')->index();
            $table->unsignedInteger('coins');
            $table->decimal('amount_kes', 10, 2)->default(0);
            $table->unsignedBigInteger('package_id')->nullable();
            $table->string('method', 20)->default('mpesa');
            $table->string('source', 20)->default('stk');
            $table->string('checkout_request_id')->nullable()->index();
            $table->string('merchant_request_id')->nullable();
            $table->string('mpesa_receipt')->nullable();
            $table->string('trans_id')->nullable()->index();
            $table->string('phone', 20)->nullable();
            $table->string('bill_ref_number')->nullable()->index();
            $table->json('meta')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('coin_transactions');
    }
};
