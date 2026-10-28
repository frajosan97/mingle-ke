<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sms_notifications', function (Blueprint $table) {
            $table->id();

            // Gateway-assigned ID (from `messageid` in response)
            $table->string('message_id')->nullable()->unique();

            $table->string('mobile');

            $table->text('message');

            // Network / telco identifier (e.g. Safaricom, Airtel)
            $table->string('network_id')->nullable();

            // Gateway response metadata
            $table->unsignedSmallInteger('response_code')->nullable();
            $table->string('response_description')->nullable();

            // Optional but useful: who/what triggered this SMS
            $table->nullableMorphs('notifiable'); // user, coin transaction, etc.

            $table->timestamps();

            $table->index('mobile');
            $table->index('response_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_notifications');
    }
};