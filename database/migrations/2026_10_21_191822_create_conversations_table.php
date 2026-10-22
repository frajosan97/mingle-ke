<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        /*
        |------------------------------------------------------------------
        | conversations
        |------------------------------------------------------------------
        */
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_one_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('user_two_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Denormalised for fast inbox listing
            $table->timestamp('last_message_at')->nullable();
            $table->string('last_message_preview', 255)->nullable();

            $table->timestamps();

            $table->unique(['user_one_id', 'user_two_id'], 'conversations_pair_unique');
            $table->index('last_message_at', 'conversations_last_msg_idx');
            $table->index('user_two_id', 'conversations_user_two_idx');
        });

        /*
        |------------------------------------------------------------------
        | conversation_participants
        |------------------------------------------------------------------
        */
        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->id();

            $table->foreignId('conversation_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->unsignedInteger('unread_count')->default(0);
            $table->timestamp('last_read_at')->nullable();
            $table->timestamp('last_delivered_at')->nullable();

            $table->boolean('is_muted')->default(false);
            $table->boolean('is_archived')->default(false);

            $table->timestamps();

            $table->unique(['conversation_id', 'user_id'], 'participants_conv_user_unique');
            $table->index(['user_id', 'is_archived'], 'participants_user_archived_idx');
        });

        /*
        |------------------------------------------------------------------
        | messages
        |------------------------------------------------------------------
        */
        Schema::create('messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('conversation_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('sender_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->enum('type', ['text', 'image', 'video', 'audio', 'file'])
                ->default('text');

            $table->text('body')->nullable();
            $table->json('attachments')->nullable();

            // Coins spent to send this message (null if free)
            $table->unsignedInteger('coins_spent')->nullable();

            $table->timestamp('edited_at')->nullable();
            $table->timestamp('deleted_at')->nullable();   // soft delete

            $table->timestamps();

            $table->index(['conversation_id', 'created_at'], 'messages_conv_created_idx');
            $table->index('sender_id', 'messages_sender_idx');
            $table->index('deleted_at', 'messages_deleted_idx');
        });

        /*
        |------------------------------------------------------------------
        | message_reads
        |------------------------------------------------------------------
        */
        Schema::create('message_reads', function (Blueprint $table) {
            $table->id();

            $table->foreignId('message_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamp('read_at')->useCurrent();

            $table->unique(['message_id', 'user_id'], 'reads_message_user_unique');
            $table->index('user_id', 'reads_user_idx');
        });
    }

    /**
     * Reverse the migrations.
     * Drop in exact reverse order so no FK is ever left dangling.
     */
    public function down(): void
    {
        Schema::dropIfExists('message_reads');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversation_participants');
        Schema::dropIfExists('conversations');
    }
};