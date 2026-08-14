import { applyBodyDevices } from '@/lib/article-devices';
import { markLeadIns } from '@/lib/product-hubs';
import { DesignSuiteView, type DeviceSample } from '@/components/admin/estilo/DesignSuiteView';
import { SAMPLES, AUTO_SAMPLE_HTML } from '@/components/admin/estilo/samples';

// El Estilo — the design suite (2026-08-14, user request): every visual
// element of the editorial system on one admin page. The devices are NOT
// screenshots or hand-copied markup — each sample runs through the same
// applyBodyDevices pipeline the article page uses, so this page can never
// drift from what actually ships: if a parser or builder changes, the
// suite changes with it, and a sample that stops rendering here would
// stop rendering in production too (that's a feature — this page doubles
// as the harness sampler the device roadmap asked for).
//
// The canonical declarations below are the library's own examples
// (.claude/playbook-editorial/dynamic-element-library.md §2), one per
// device, grouped the way the coverage map groups story shapes.

export default function AdminEstiloPage() {
  const today = new Date().toISOString().slice(0, 10);
  const devices: DeviceSample[] = SAMPLES.map(sample => {
    const paragraph = `<p>${sample.syntax}</p>`;
    // Budget of one per call: each sample renders alone, exactly like a
    // short article carrying its single device.
    const html = applyBodyDevices(paragraph, 2, null, { articleDate: today });
    return { ...sample, html, renders: html !== paragraph };
  });
  const autoHtml = markLeadIns(AUTO_SAMPLE_HTML);

  return (
    <main className="admin-main analytics-main estilo-main">
      <DesignSuiteView devices={devices} autoHtml={autoHtml} />
    </main>
  );
}
