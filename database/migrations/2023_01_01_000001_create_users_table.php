<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // Identity
            $table->string('name');
            $table->string('email')->unique();
            $table->string('avatar')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();

            // Social profile
            $table->string('phone', 20)->nullable();
            $table->unsignedTinyInteger('age')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->text('bio')->nullable();

            // Subscription
            $table->enum('tier', [
                'regular',
                'premium'
            ])->default('regular');
            $table->enum('subscription_plan', [
                'daily',
                'weekly',
                'monthly',
                'annual'
            ])->nullable();
            $table->timestamp('subscription_started_at')->nullable();
            $table->timestamp('subscription_expires_at')->nullable();
            $table->boolean('auto_renew')->default(false);

            // Wallet
            $table->unsignedInteger('coins')->default(0);

            // Location
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();
            $table->foreignId('county_id')->nullable()->constrained('counties')->nullOnDelete();
            $table->foreignId('town_id')->nullable()->constrained('towns')->nullOnDelete();
            $table->string('area', 100)->nullable();

            // Trust & activity
            $table->boolean('is_verified')->default(false);
            $table->timestamp('last_active_at')->nullable();
            $table->boolean('is_online')->default(false);
            $table->timestamp('last_seen_at')->nullable();

            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['tier', 'subscription_expires_at'], 'users_tier_sub_expires_idx');
            $table->index(['subscription_plan', 'subscription_expires_at'], 'users_sub_plan_expires_idx');
            $table->index(['lat', 'lng'], 'users_location_idx');
            $table->index('last_active_at', 'users_last_active_idx');
            $table->index('county_id', 'users_county_idx');
            $table->index('town_id', 'users_town_idx');
        });

        // Configurable pricing options per feature type
        Schema::create('pricing_plans', function (Blueprint $table) {
            $table->id();
            $table->string('type')->default('escort_listing');
            $table->string('key');
            $table->string('label');
            $table->unsignedInteger('days')->nullable();
            $table->decimal('unit_price', 12, 2);
            $table->decimal('total_price', 12, 2)->nullable();
            $table->string('currency', 3)->default('KES');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_default')->default(false);
            $table->string('badge')->nullable();
            $table->decimal('discount_percent', 5, 2)->default(0);
            $table->timestamps();

            $table->unique([
                'type',
                'key'
            ], 'pricing_plans_type_key_unique');
            $table->index([
                'type',
                'is_active',
                'sort_order'
            ], 'pricing_plans_type_active_sort_idx');
        });

        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            // Escort attributes
            $table->enum('orientation', [
                'straight',
                'gay',
                'bisexual',
                'lesbian',
                'other'
            ])->nullable();
            $table->unsignedTinyInteger('height_cm')->nullable();
            $table->unsignedTinyInteger('weight_kg')->nullable();
            $table->string('body_type', 50)->nullable();
            $table->string('hair_color', 50)->nullable();
            $table->string('eye_color', 50)->nullable();
            $table->string('ethnicity', 50)->nullable();
            $table->json('services')->nullable();
            $table->boolean('smoking')->default(false);
            $table->boolean('drinking')->default(false);

            // Rates
            $table->unsignedInteger('rate_15min')->nullable();
            $table->unsignedInteger('rate_30min')->nullable();
            $table->unsignedInteger('rate_1hour')->nullable();
            $table->unsignedInteger('rate_night')->nullable();
            $table->string('currency', 3)->default('KES');

            // Availability
            $table->boolean('is_available')->default(true);
            $table->enum('availability_status', [
                'online',
                'offline',
                'busy',
                'incall',
                'outcall'
            ])->default('offline');
            $table->boolean('incall')->default(false);
            $table->boolean('outcall')->default(false);

            // Media
            $table->string('cover_image')->nullable();
            $table->json('gallery')->nullable();

            // Moderation
            $table->boolean('is_approved')->default(false);
            $table->timestamp('approved_at')->nullable();
            $table->boolean('is_featured')->default(false);

            // Listing tier
            $table->enum('listing_tier', ['free', 'escort'])->default('free');
            $table->timestamp('listing_started_at')->nullable();
            $table->timestamp('listing_expires_at')->nullable();
            $table->boolean('phone_visible')->default(false);

            // Stats
            $table->unsignedInteger('profile_views')->default(0);
            $table->unsignedInteger('rating_count')->default(0);
            $table->decimal('rating_avg', 3, 2)->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_approved', 'is_available'], 'profiles_approved_available_idx');
            $table->index('availability_status', 'profiles_avail_status_idx');
            $table->index('is_featured', 'profiles_featured_idx');
            $table->index(['listing_tier', 'listing_expires_at'], 'profiles_listing_tier_expires_idx');
            $table->index(['listing_tier', 'is_approved'], 'profiles_listing_tier_approved_idx');
        });

        Schema::create('escort_listing_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('user_profile_id')->nullable()->constrained('user_profiles')->nullOnDelete();
            $table->foreignId('pricing_plan_id')->nullable()->constrained('pricing_plans')->nullOnDelete();

            $table->string('gateway', 20);
            $table->string('reference', 64)->unique();
            $table->string('gateway_reference', 128)->nullable();
            $table->unsignedInteger('days');
            $table->decimal('unit_price', 12, 2);
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3);
            $table->enum('status', [
                'pending',
                'paid',
                'failed',
                'cancelled'
            ])->default('pending');
            $table->json('payload')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status'], 'listing_payments_user_status_idx');
            $table->index(['status', 'paid_at'], 'listing_payments_status_paid_idx');
        });

        Schema::create('phone_reveals', function (Blueprint $table) {
            $table->id();

            $table->foreignId('viewer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('user_profile_id')->constrained('user_profiles')->cascadeOnDelete();

            $table->unsignedInteger('coins_spent')->default(0);
            $table->timestamp('revealed_at');
            $table->timestamps();

            $table->unique(['viewer_id', 'user_profile_id'], 'phone_reveals_viewer_profile_unique');
        });

        Schema::create('user_reviews', function (Blueprint $table) {
            $table->id();

            $table->foreignId('reviewer_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('escort_id')->constrained('users')->cascadeOnDelete();

            $table->unsignedTinyInteger('rating');
            $table->text('body')->nullable();
            $table->boolean('is_approved')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['reviewer_id', 'escort_id', 'deleted_at'], 'reviews_reviewer_escort_unique');
            $table->index(['escort_id', 'is_approved'], 'reviews_escort_approved_idx');
        });

        Schema::create('user_blocks', function (Blueprint $table) {
            $table->id();

            $table->foreignId('blocker_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('blocked_id')->constrained('users')->cascadeOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['blocker_id', 'blocked_id', 'deleted_at'], 'blocks_pair_unique');
            $table->index('blocked_id', 'blocks_blocked_idx');
        });

        Schema::create('user_reports', function (Blueprint $table) {
            $table->id();

            $table->foreignId('reporter_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('reported_id')->constrained('users')->cascadeOnDelete();

            $table->string('reason', 100);
            $table->text('details')->nullable();
            $table->enum('status', [
                'open',
                'reviewing',
                'resolved',
                'dismissed'
            ])->default('open');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['reported_id', 'status'], 'reports_reported_status_idx');
            $table->index('status', 'reports_status_idx');
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
            $table->softDeletes();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();

            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();

            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('user_reports');
        Schema::dropIfExists('user_blocks');
        Schema::dropIfExists('user_reviews');
        Schema::dropIfExists('phone_reveals');
        Schema::dropIfExists('escort_listing_payments');
        Schema::dropIfExists('user_profiles');
        Schema::dropIfExists('pricing_plans');
        Schema::dropIfExists('users');
    }
};