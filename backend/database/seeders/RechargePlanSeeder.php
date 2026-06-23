<?php

namespace Database\Seeders;

use App\Models\RechargePlan;
use Illuminate\Database\Seeder;

class RechargePlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            // Airtel
            ['operator' => 'airtel', 'plan_name' => 'Airtel ₹199 Pack', 'amount' => 199, 'data_limit' => '1.5GB/day', 'validity' => '28 days', 'type' => 'prepaid', 'description' => '1.5GB/day, Unlimited Calls, 100 SMS/day'],
            ['operator' => 'airtel', 'plan_name' => 'Airtel ₹299 Pack', 'amount' => 299, 'data_limit' => '2GB/day', 'validity' => '28 days', 'type' => 'prepaid', 'description' => '2GB/day, Unlimited Calls, 100 SMS/day, Airtel Xstream'],
            ['operator' => 'airtel', 'plan_name' => 'Airtel ₹399 Pack', 'amount' => 399, 'data_limit' => '3GB/day', 'validity' => '28 days', 'type' => 'prepaid', 'description' => '3GB/day, Unlimited Calls, 100 SMS/day, Airtel Xstream, Wynk Music'],
            ['operator' => 'airtel', 'plan_name' => 'Airtel ₹599 Pack', 'amount' => 599, 'data_limit' => '2GB/day', 'validity' => '56 days', 'type' => 'prepaid', 'description' => '2GB/day, Unlimited Calls, 100 SMS/day'],
            ['operator' => 'airtel', 'plan_name' => 'Airtel ₹999 Pack', 'amount' => 999, 'data_limit' => '2GB/day', 'validity' => '84 days', 'type' => 'prepaid', 'description' => '2GB/day, Unlimited Calls, 100 SMS/day, Amazon Prime'],

            // Jio
            ['operator' => 'jio', 'plan_name' => 'Jio ₹155 Pack', 'amount' => 155, 'data_limit' => '1GB/day', 'validity' => '28 days', 'type' => 'prepaid', 'description' => '1GB/day, Unlimited Calls, 100 SMS/day'],
            ['operator' => 'jio', 'plan_name' => 'Jio ₹239 Pack', 'amount' => 239, 'data_limit' => '1.5GB/day', 'validity' => '28 days', 'type' => 'prepaid', 'description' => '1.5GB/day, Unlimited Calls, 100 SMS/day'],
            ['operator' => 'jio', 'plan_name' => 'Jio ₹299 Pack', 'amount' => 299, 'data_limit' => '2GB/day', 'validity' => '28 days', 'type' => 'prepaid', 'description' => '2GB/day, Unlimited Calls, 100 SMS/day'],
            ['operator' => 'jio', 'plan_name' => 'Jio ₹599 Pack', 'amount' => 599, 'data_limit' => '2GB/day', 'validity' => '56 days', 'type' => 'prepaid', 'description' => '2GB/day, Unlimited Calls, 100 SMS/day'],
            ['operator' => 'jio', 'plan_name' => 'Jio ₹999 Pack', 'amount' => 999, 'data_limit' => '3GB/day', 'validity' => '84 days', 'type' => 'prepaid', 'description' => '3GB/day, Unlimited Calls, 100 SMS/day, JioTV, JioCinema'],

            // Vi (Vodafone Idea)
            ['operator' => 'vi', 'plan_name' => 'Vi ₹179 Pack', 'amount' => 179, 'data_limit' => '1GB/day', 'validity' => '28 days', 'type' => 'prepaid', 'description' => '1GB/day, Unlimited Calls, 100 SMS/day'],
            ['operator' => 'vi', 'plan_name' => 'Vi ₹299 Pack', 'amount' => 299, 'data_limit' => '1.5GB/day', 'validity' => '28 days', 'type' => 'prepaid', 'description' => '1.5GB/day, Unlimited Calls, 100 SMS/day'],
            ['operator' => 'vi', 'plan_name' => 'Vi ₹399 Pack', 'amount' => 399, 'data_limit' => '2GB/day', 'validity' => '28 days', 'type' => 'prepaid', 'description' => '2GB/day, Unlimited Calls, 100 SMS/day, Vi Movies'],
            ['operator' => 'vi', 'plan_name' => 'Vi ₹599 Pack', 'amount' => 599, 'data_limit' => '2GB/day', 'validity' => '56 days', 'type' => 'prepaid', 'description' => '2GB/day, Unlimited Calls, 100 SMS/day'],

            // BSNL
            ['operator' => 'bsnl', 'plan_name' => 'BSNL ₹147 Pack', 'amount' => 147, 'data_limit' => '1GB/day', 'validity' => '28 days', 'type' => 'prepaid', 'description' => '1GB/day, Unlimited Calls, 100 SMS/day'],
            ['operator' => 'bsnl', 'plan_name' => 'BSNL ₹199 Pack', 'amount' => 199, 'data_limit' => '2GB/day', 'validity' => '28 days', 'type' => 'prepaid', 'description' => '2GB/day, Unlimited Calls, 100 SMS/day'],
            ['operator' => 'bsnl', 'plan_name' => 'BSNL ₹299 Pack', 'amount' => 299, 'data_limit' => '2GB/day', 'validity' => '56 days', 'type' => 'prepaid', 'description' => '2GB/day, Unlimited Calls, 100 SMS/day'],
            ['operator' => 'bsnl', 'plan_name' => 'BSNL ₹399 Pack', 'amount' => 399, 'data_limit' => '3GB/day', 'validity' => '56 days', 'type' => 'prepaid', 'description' => '3GB/day, Unlimited Calls, 100 SMS/day'],
        ];

        foreach ($plans as $plan) {
            RechargePlan::create($plan);
        }
    }
}
