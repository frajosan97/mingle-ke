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

            // last message_at
            $table->timestamp('last_message_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['user_one_id', 'user_two_id'], 'conversations_pair_unique');
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
            $table->timestamp('last_delivered_at')->nullable();
            $table->timestamp('last_read_at')->nullable();

            $table->boolean('is_muted')->default(false);
            $table->boolean('is_archived')->default(false);

            $table->timestamps();
            $table->softDeletes();

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

            $table->string('type')->default('text');
            $table->text('body')->nullable();
            $table->unsignedInteger('coins_spent')->nullable();
            $table->timestamp('edited_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['conversation_id', 'created_at'], 'messages_conv_created_idx');
            $table->index('sender_id', 'messages_sender_idx');
            $table->index('type', 'messages_type_idx');
        });

        /*
        |------------------------------------------------------------------
        | message_attachments
        |------------------------------------------------------------------
        */
        Schema::create('message_attachments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('message_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('type')->default('image');

            // Storage location — explicit columns instead of a JSON blob
            $table->string('disk', 32)->default('public');   // filesystems.php disk
            $table->string('path');                          // relative path on disk
            $table->string('original_name')->nullable();     // user-supplied name
            $table->string('mime_type', 128)->nullable();
            $table->unsignedBigInteger('size_bytes')->nullable();

            // Optional media metadata (nullable — only set for relevant types)
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->unsignedInteger('duration_seconds')->nullable();

            // Order within a message (e.g. image carousel position)
            $table->unsignedSmallInteger('position')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['message_id', 'position'], 'attachments_msg_pos_idx');
            $table->index('type', 'attachments_type_idx');
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

            $table->timestamps();
            $table->softDeletes();

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
        Schema::dropIfExists('message_attachments');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversation_participants');
        Schema::dropIfExists('conversations');
    }
};