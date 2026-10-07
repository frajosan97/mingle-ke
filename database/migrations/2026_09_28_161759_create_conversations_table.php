<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Chat subsystem.
     */
    public function up(): void
    {
        /*
        |------------------------------------------------------------------
        | conversations
        |------------------------------------------------------------------
        | A 1:1 thread between two users.
        | INVARIANT: user_one_id < user_two_id (enforced in a model
        | mutator) so (A,B) and (B,A) can never both exist.
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
        | Per-user state for a conversation: unread count, mute, archive.
        | Two rows per 1:1 conversation (one for each side).
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

            /*
             | last_delivered_at
             | Tracks the high-water mark of messages this participant has
             | pulled from the server. Any message in the conversation with
             | created_at <= last_delivered_at is considered DELIVERED
             | (double grey tick) to this user.
             |
             | Kept per-participant rather than per-message so a single
             | bulk UPDATE (on app open / conversation fetch) can advance
             | the delivery watermark without touching every message row.
             */
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
        | The actual chat messages.
        | Soft-deleted (deleted_at) so "delete for me" and moderation
        | retain a trace; never hard-delete unless the conversation dies.
        |
        | Tick state (from the sender's perspective):
        |   ✓   SENT      -> row exists, no delivered_at, no read receipt
        |   ✓✓  DELIVERED -> delivered_at IS NOT NULL, no read receipt
        |   ✓✓  READ      -> a row exists in message_reads for the recipient
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
            $table->string('attachment')->nullable();

            // Coins spent to send this message (null if free)
            $table->unsignedInteger('coins_spent')->nullable();

            $table->timestamp('edited_at')->nullable();

            /*
             | delivered_at
             | When the recipient's client acknowledged receipt of this
             | message. NULL == still only SENT (single tick).
             | Set by the "message delivered" endpoint / websocket ack.
             |
             | Note: in a future group-chat world this becomes a
             | per-recipient table (message_deliveries), mirroring
             | message_reads. Kept as a column here because the current
             | schema is explicitly 1:1.
             */
            $table->timestamp('delivered_at')->nullable();

            $table->timestamp('deleted_at')->nullable();   // soft delete

            $table->timestamps();

            $table->index(['conversation_id', 'created_at'], 'messages_conv_created_idx');
            $table->index('sender_id', 'messages_sender_idx');
            $table->index('deleted_at', 'messages_deleted_idx');

            // Helps the "mark undelivered messages delivered" sweep.
            $table->index(['conversation_id', 'delivered_at'], 'messages_conv_delivered_idx');
        });

        /*
        |------------------------------------------------------------------
        | message_reads
        |------------------------------------------------------------------
        | Read receipt ledger. One row per (message, reader).
        | Kept separate from `messages` so group chat can be added later
        | without a schema rewrite.
        |
        | Presence of a row here == BLUE double tick for the sender.
        */
        Schema::create('message_reads', function (Blueprint $table) {
            $table->id();

            $table->foreignId('message_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->timestamp('read_at');

            $table->unique(['message_id', 'user_id'], 'reads_message_user_unique');
            $table->index('user_id', 'reads_user_idx');
        });
    }

    /**
     * Reverse the migrations.
     *
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