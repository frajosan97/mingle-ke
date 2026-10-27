<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('counties', function (Blueprint $table) {
            $table->id();
            $table->string('code', 3)->unique();      // IEBC county code, 001–047
            $table->string('name', 60)->unique();      // "Nairobi", "Mombasa"
            $table->string('slug', 60)->unique();
            $table->decimal('lat', 10, 7)->nullable(); // county centroid
            $table->decimal('lng', 10, 7)->nullable();
            $table->timestamps();
        });

        Schema::create('towns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('county_id')->constrained()->cascadeOnDelete();
            $table->string('name', 80);                // "Westlands", "Nyali"
            $table->string('slug', 80);
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->boolean('is_major')->default(false); // big enough for filters
            $table->timestamps();

            $table->unique(['county_id', 'slug']);
            $table->index(['county_id', 'is_major']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('towns');
        Schema::dropIfExists('counties');
    }
};