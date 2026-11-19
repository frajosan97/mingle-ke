<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Users
        |--------------------------------------------------------------------------
        */

        Schema::create('users', function (Blueprint $table) {
            $table->id();

            // Identity
            $table->string('name');
            $table->string('email')->unique();
            $table->string('avatar')->nullable();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password')->nullable();

            // Contact
            $table->string('phone', 20)->nullable();

            // Social profile
            $table->unsignedTinyInteger('age')->nullable();
            $table->enum('gender', ['male', 'female', 'other'])->nullable();
            $table->text('bio')->nullable();

            // Subscription
            $table->enum('tier', ['regular', 'premium'])->default('regular');

            $table->enum('subscription_plan', [
                'daily',
                'weekly',
                'monthly',
                'annual',
            ])->nullable();

            $table->timestamp('subscription_started_at')->nullable();
            $table->timestamp('subscription_expires_at')->nullable();
            $table->boolean('auto_renew')->default(false);

            // Wallet
            $table->unsignedInteger('coins')->default(0);

            // Location
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();

            $table->foreignId('county_id')
                ->nullable()
                ->constrained('counties')
                ->nullOnDelete();

            $table->foreignId('town_id')
                ->nullable()
                ->constrained('towns')
                ->nullOnDelete();

            $table->string('area', 100)->nullable();

            // Trust and activity
            $table->boolean('is_verified')->default(false);
            $table->timestamp('last_active_at')->nullable();
            $table->boolean('is_online')->default(false);
            $table->timestamp('last_seen_at')->nullable();

            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            $table->index(
                ['tier', 'subscription_expires_at'],
                'users_tier_sub_expires_idx'
            );

            $table->index(
                ['subscription_plan', 'subscription_expires_at'],
                'users_sub_plan_expires_idx'
            );

            $table->index(['lat', 'lng'], 'users_location_idx');
            $table->index('last_active_at', 'users_last_active_idx');
            $table->index('county_id', 'users_county_idx');
            $table->index('town_id', 'users_town_idx');
        });

        /*
        |--------------------------------------------------------------------------
        | Pricing Plans
        |--------------------------------------------------------------------------
        */

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

            $table->unique(
                ['type', 'key'],
                'pricing_plans_type_key_unique'
            );

            $table->index(
                ['type', 'is_active', 'sort_order'],
                'pricing_plans_type_active_sort_idx'
            );
        });

        /*
        |--------------------------------------------------------------------------
        | User Profiles
        |--------------------------------------------------------------------------
        */

        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();

            // Escort attributes
            $table->enum('orientation', [
                'straight',
                'gay',
                'bisexual',
                'lesbian',
                'other',
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
                'outcall',
            ])->default('offline');

            $table->boolean('incall')->default(false);
            $table->boolean('outcall')->default(false);

            // Moderation
            $table->boolean('is_approved')->default(false);
            $table->timestamp('approved_at')->nullable();
            $table->boolean('is_featured')->default(false);

            // Listing
            $table->enum('listing_tier', ['free', 'escort'])
                ->default('free');

            $table->timestamp('listing_started_at')->nullable();
            $table->timestamp('listing_expires_at')->nullable();

            $table->boolean('phone_visible')->default(false);

            // Statistics
            $table->unsignedInteger('profile_views')->default(0);
            $table->unsignedInteger('rating_count')->default(0);
            $table->decimal('rating_avg', 3, 2)->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index(
                ['is_approved', 'is_available'],
                'profiles_approved_available_idx'
            );

            $table->index(
                'availability_status',
                'profiles_avail_status_idx'
            );

            $table->index(
                'is_featured',
                'profiles_featured_idx'
            );

            $table->index(
                ['listing_tier', 'listing_expires_at'],
                'profiles_listing_tier_expires_idx'
            );

            $table->index(
                ['listing_tier', 'is_approved'],
                'profiles_listing_tier_approved_idx'
            );
        });

        /*
        |--------------------------------------------------------------------------
        | User Images
        |--------------------------------------------------------------------------
        */
        Schema::create('user_images', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('path');
            $table->string('disk', 20)->default('public');
            $table->string('url')->nullable();

            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->unsignedInteger('size_bytes')->nullable();
            $table->string('mime_type', 100)->nullable();

            $table->boolean('is_cover')->default(false);
            $table->unsignedInteger('sort_order')->default(0);

            $table->enum('status', ['pending', 'approved', 'rejected'])
                ->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->string('rejection_reason')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'is_cover'], 'user_images_user_cover_idx');
            $table->index(['user_id', 'sort_order'], 'user_images_user_sort_idx');
            $table->index(['user_id', 'status'], 'user_images_user_status_idx');
        });

        /*
        |--------------------------------------------------------------------------
        | User Videos
        |--------------------------------------------------------------------------
        */
        Schema::create('user_videos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('path');
            $table->string('disk', 20)->default('public');
            $table->string('url')->nullable();
            $table->string('thumbnail_path')->nullable();

            $table->unsignedInteger('duration_seconds')->nullable();
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->unsignedInteger('size_bytes')->nullable();
            $table->string('mime_type', 100)->nullable();

            $table->unsignedInteger('sort_order')->default(0);

            $table->enum('status', ['pending', 'approved', 'rejected'])
                ->default('pending');
            $table->timestamp('approved_at')->nullable();
            $table->string('rejection_reason')->nullable();

            $table->enum('processing_status', [
                'pending',
                'processing',
                'ready',
                'failed',
            ])->default('ready');

            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'sort_order'], 'user_videos_user_sort_idx');
            $table->index(['user_id', 'status'], 'user_videos_user_status_idx');
        });

        /*
        |--------------------------------------------------------------------------
        | M-PESA Transactions
        |--------------------------------------------------------------------------
        |
        | Central payment ledger for:
        | - coins_purchase
        | - escort_listing_fees
        | - withdrawal
        |
        */

        Schema::create('mpesa_transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // Business purpose
            $table->string('type', 50);

            // inbound or outbound
            $table->string('direction', 20);

            // pending, processing, unknown, completed, failed, cancelled
            $table->string('status', 30)->default('pending');

            // Financial details
            $table->decimal('amount', 12, 2);
            $table->char('currency', 3)->default('KES');

            // Customer details
            $table->string('phone', 20)->nullable();
            $table->string('bill_ref_number', 100)->nullable();

            // Internal reference
            $table->string('reference', 100)->unique();

            // M-PESA identifiers
            $table->string('checkout_request_id', 100)
                ->nullable()
                ->unique();

            $table->string('merchant_request_id', 100)
                ->nullable()
                ->index();

            $table->string('mpesa_receipt', 100)
                ->nullable()
                ->unique();

            $table->string('trans_id', 100)
                ->nullable()
                ->unique();

            // Escort listing payment details
            $table->foreignId('user_profile_id')
                ->nullable()
                ->constrained('user_profiles')
                ->nullOnDelete();

            $table->foreignId('pricing_plan_id')
                ->nullable()
                ->constrained('pricing_plans')
                ->nullOnDelete();

            $table->unsignedInteger('days')->nullable();
            $table->decimal('unit_price', 12, 2)->nullable();

            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            // Coin purchase details
            $table->unsignedInteger('coins')->nullable();
            $table->unsignedBigInteger('package_id')->nullable();

            // Gateway response
            $table->string('result_code', 30)->nullable();
            $table->text('result_desc')->nullable();

            $table->json('gateway_response')->nullable();
            $table->json('meta')->nullable();

            // Lifecycle
            $table->timestamp('requested_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('failed_at')->nullable();

            $table->timestamps();

            $table->index(
                ['user_id', 'type', 'status'],
                'mpesa_user_type_status_idx'
            );

            $table->index(
                ['type', 'status', 'created_at'],
                'mpesa_type_status_created_idx'
            );

            $table->index(
                ['direction', 'status'],
                'mpesa_direction_status_idx'
            );

            $table->index(
                ['status', 'created_at'],
                'mpesa_status_created_idx'
            );

            $table->index(
                ['user_profile_id', 'status'],
                'mpesa_profile_status_idx'
            );
        });

        /*
        |--------------------------------------------------------------------------
        | Coin Transactions
        |--------------------------------------------------------------------------
        |
        | Accounting ledger for every coin balance change.
        |
        | Types:
        | - purchase
        | - bonus
        | - invite
        | - spend
        | - refund
        |
        | Phone reveals are recorded here as normal spend transactions.
        |
        */

        Schema::create('coin_transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // purchase, bonus, invite, spend, refund
            $table->string('type', 20);

            // Always positive; type determines credit or debit.
            $table->unsignedInteger('coins');

            // Optional source M-PESA transaction
            $table->foreignId('mpesa_transaction_id')
                ->nullable()
                ->constrained('mpesa_transactions')
                ->nullOnDelete();

            // Optional package identifier
            $table->unsignedBigInteger('package_id')->nullable();

            // Prevent duplicate operations such as repeated phone reveals.
            $table->string('reference', 150)->nullable()->unique();

            $table->string('description')->nullable();
            $table->json('meta')->nullable();

            $table->timestamps();

            $table->index(
                ['user_id', 'created_at'],
                'coin_transactions_user_created_idx'
            );

            $table->index(
                ['user_id', 'type'],
                'coin_transactions_user_type_idx'
            );
        });

        /*
        |--------------------------------------------------------------------------
        | Point Transactions
        |--------------------------------------------------------------------------
        |
        | Accounting ledger for every point balance change.
        |
        | Types:
        | - purchase
        | - bonus
        | - invite
        | - spend
        | - refund
        |
        | Phone reveals are recorded here as normal spend transactions.
        |
        */
        Schema::create('point_transactions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();
            $table->string('type', 50);
            $table->enum('direction', ['credit', 'debit']);
            $table->unsignedBigInteger('points');
            $table->string('reference', 100)->nullable();
            $table->string('description')->nullable();
            $table->json('meta')->nullable();

            $table->timestamps();

            $table->unique(
                ['user_id', 'reference'],
                'point_transactions_user_reference_unique'
            );

            $table->index(
                ['user_id', 'created_at'],
                'point_transactions_user_created_index'
            );

            $table->index(
                ['user_id', 'direction'],
                'point_transactions_user_direction_index'
            );

            $table->index(
                ['user_id', 'type'],
                'point_transactions_user_type_index'
            );
        });

        /*
        |--------------------------------------------------------------------------
        | User Reviews
        |--------------------------------------------------------------------------
        */

        Schema::create('user_reviews', function (Blueprint $table) {
            $table->id();

            $table->foreignId('reviewer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('escort_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->unsignedTinyInteger('rating');
            $table->text('body')->nullable();

            $table->boolean('is_approved')->default(false);

            $table->timestamps();
            $table->softDeletes();

            $table->unique(
                ['reviewer_id', 'escort_id', 'deleted_at'],
                'reviews_reviewer_escort_unique'
            );

            $table->index(
                ['escort_id', 'is_approved'],
                'reviews_escort_approved_idx'
            );
        });

        /*
        |--------------------------------------------------------------------------
        | User Likes
        |--------------------------------------------------------------------------
        */

        Schema::create('user_likes', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('liked_user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamps();

            $table->unique(['user_id', 'liked_user_id']);

            $table->index('liked_user_id');
        });

        /*
        |--------------------------------------------------------------------------
        | User Blocks
        |--------------------------------------------------------------------------
        */

        Schema::create('user_blocks', function (Blueprint $table) {
            $table->id();

            $table->foreignId('blocker_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('blocked_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(
                ['blocker_id', 'blocked_id', 'deleted_at'],
                'blocks_pair_unique'
            );

            $table->index('blocked_id', 'blocks_blocked_idx');
        });

        /*
        |--------------------------------------------------------------------------
        | User Reports
        |--------------------------------------------------------------------------
        */

        Schema::create('user_reports', function (Blueprint $table) {
            $table->id();

            $table->foreignId('reporter_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('reported_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('reason', 100);
            $table->text('details')->nullable();

            $table->enum('status', [
                'open',
                'reviewing',
                'resolved',
                'dismissed',
            ])->default('open');

            $table->timestamps();
            $table->softDeletes();

            $table->index(
                ['reported_id', 'status'],
                'reports_reported_status_idx'
            );

            $table->index('status', 'reports_status_idx');
        });

        /*
        |--------------------------------------------------------------------------
        | Password Reset Tokens
        |--------------------------------------------------------------------------
        */

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        /*
        |--------------------------------------------------------------------------
        | Sessions
        |--------------------------------------------------------------------------
        */

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');

        Schema::dropIfExists('user_reports');
        Schema::dropIfExists('user_blocks');
        Schema::dropIfExists('user_likes');
        Schema::dropIfExists('user_reviews');

        Schema::dropIfExists('point_transactions');
        Schema::dropIfExists('coin_transactions');
        Schema::dropIfExists('mpesa_transactions');

        Schema::dropIfExists('user_videos');
        Schema::dropIfExists('user_images');
        Schema::dropIfExists('user_profiles');
        Schema::dropIfExists('pricing_plans');
        Schema::dropIfExists('users');
    }
};
