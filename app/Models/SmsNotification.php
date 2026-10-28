<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class SmsNotification extends Model
{
    protected $table = 'sms_notifications';

    protected $fillable = [
        'message_id',
        'mobile',
        'message',
        'network_id',
        'response_code',
        'response_description',
        'notifiable_type',
        'notifiable_id',
    ];

    protected $casts = [
        'response_code' => 'integer',
    ];

    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }
}