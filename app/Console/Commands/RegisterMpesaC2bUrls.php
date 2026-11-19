<?php

namespace App\Console\Commands;

use App\Services\MpesaService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('mpesa:register-c2b')]
#[Description('Register C2B Validation and Confirmation URLs with Safaricom.')]
class RegisterMpesaC2bUrls extends Command
{
    public function handle(MpesaService $mpesa): int
    {
        $result = $mpesa->registerC2bUrls();

        if (!($result['success'] ?? false)) {
            $this->error($result['message'] ?? 'Registration failed.');
            if (isset($result['raw'])) {
                $this->line(json_encode($result['raw'], JSON_PRETTY_PRINT));
            }
            return self::FAILURE;
        }

        $this->info('C2B URLs registered successfully.');
        if (isset($result['raw'])) {
            $this->line(json_encode($result['raw'], JSON_PRETTY_PRINT));
        }

        return self::SUCCESS;
    }
}