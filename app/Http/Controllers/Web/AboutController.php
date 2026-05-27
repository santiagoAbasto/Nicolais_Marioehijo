<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\SiteSection;
use Illuminate\Contracts\View\View;

class AboutController extends Controller
{
    public function show(): View
    {
        $sections = SiteSection::query()
            ->with(['media', 'fieldValues'])
            ->where('page_key', 'nosotros')
            ->whereIn('section_key', ['intro', 'mission_vision', 'values'])
            ->get()
            ->keyBy('section_key');

        $intro = $sections->get('intro');
        $missionVision = $sections->get('mission_vision');
        $values = $sections->get('values');

        return view('web.about.show', [
            'intro' => $intro,
            'missionVision' => $missionVision,
            'values' => $values,
            'missionTitle' => $this->field($missionVision, 'mision_label') ?: $missionVision?->title ?: 'Misión',
            'missionText' => $this->field($missionVision, 'mision') ?: $missionVision?->description,
            'visionTitle' => $this->field($missionVision, 'vision_label') ?: $missionVision?->subtitle ?: 'Visión',
            'visionText' => $this->field($missionVision, 'vision'),
            'valuesTitle' => $this->field($values, 'valores_label') ?: $values?->title ?: 'Valores',
            'valuesText' => $this->field($values, 'valores') ?: $values?->description,
        ]);
    }

    protected function field(?SiteSection $section, string $key): ?string
    {
        return $section?->fieldValues
            ->firstWhere('field_key', $key)
            ?->field_value;
    }
}
