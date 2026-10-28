<?php
// database/migrations/xxxx_xx_xx_xxxxxx_create_likes_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_likes', function (Blueprint $table) {
            $table->id();

            // The user who gave the like.
            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // The user who received the like.
            $table->foreignId('liked_user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamps();

            // Prevent duplicate likes from the same user.
            $table->unique(['user_id', 'liked_user_id']);

            // Speeds up "who liked me" and "did I like X" queries.
            $table->index('liked_user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_likes');
    }
};