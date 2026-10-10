---
layout: page
title: IrisFlow
permalink: /irisflow/
description: Inverse design of multilayer optical coatings, with the design space as the input
nav: true
nav_order: 1
---

<link rel="stylesheet" href="{{ '/assets/css/irisflow.css' | relative_url | bust_file_cache }}" />
<link rel="stylesheet" href="{{ '/assets/css/outline.css' | relative_url | bust_file_cache }}" />

**IrisFlow** is a generative model for the inverse design of multilayer optical coatings. You hand it a _design request_: the spectrum you want, the wavelength band you care about, the materials you can actually deposit, given only as their optical curves, and how many layers you allow. It generates a pool of candidate stacks from pure noise, denoising the discrete material choices and the continuous thicknesses together. Every candidate is re-simulated exactly, so you select by whatever rule matters to you and take the recipe to the deposition chamber.

<div class="site-actions">
  <a class="site-btn" href="#if-live">Try the model</a>
  <a class="site-arrow" href="#if-how">How it works</a>
  <a class="site-arrow" href="https://arxiv.org/abs/2607.08392">Paper</a>
</div>

## Try the real model {#if-live}

The other panels on this page are illustrations. This one runs IrisFlow itself: your request goes to a [Hugging Face Space](https://huggingface.co/spaces/lz-1/IrisFlow), which borrows a GPU for a few seconds, generates several designs and re-simulates each one with the transfer-matrix method (normal incidence, from air onto a fused-silica substrate; layer 1 sits on the substrate). The materials that were never seen in training are given to the model only as their n,k curves. Hugging Face gives each anonymous visitor only a few GPU runs; after that, or when no GPU is free, the request runs on a CPU with at most 8 designs and takes longer. If nobody has used the Space for a while it sleeps, and the first request takes about a minute to wake it.

<div class="if-live" data-if-live="lz-1/IrisFlow" data-presets="{{ '/assets/json/irisflow-presets.json' | relative_url }}"></div>

## How it works {#if-how}

<div class="site-tabs" role="tablist" aria-label="How IrisFlow works" data-site-tabs>
  <button type="button" role="tab" id="tab-if-map" aria-controls="if-map" aria-selected="true">What it can do</button>
  <button type="button" role="tab" id="tab-if-joint" aria-controls="if-joint" aria-selected="false" tabindex="-1">Two flows, one network</button>
  <button type="button" role="tab" id="tab-if-inside" aria-controls="if-inside" aria-selected="false" tabindex="-1">Data pipeline</button>
  <button type="button" role="tab" id="tab-if-studio" aria-controls="if-studio" aria-selected="false" tabindex="-1">Design in four steps</button>
</div>

<div class="site-tabpanel" role="tabpanel" id="if-map" aria-labelledby="tab-if-map">
  <p>One trained model, and what it gives a coating designer.</p>
  <div class="if-idea if-map" data-if-map></div>
</div>

<div class="site-tabpanel" role="tabpanel" id="if-joint" aria-labelledby="tab-if-joint" hidden>
  <p>A coating is a list of layers, each with a material and a thickness, and IrisFlow generates both at once: a continuous flow for the thicknesses and a discrete flow for the materials, under one shared clock. They are not two samplers running side by side. At every step one network reads each layer’s thickness and material together, and what it predicts crosses over: thicknesses reshape the material probabilities, and materials move the predicted final thicknesses.</p>
  <div class="if-idea" data-if-idea="joint"></div>
</div>

<div class="site-tabpanel" role="tabpanel" id="if-inside" aria-labelledby="tab-if-inside" hidden>
  <p>The mechanism in one picture, organised around the layer tokens in the middle.</p>
  <div class="if-pipeline" data-if-pipeline></div>
</div>

<div class="site-tabpanel" role="tabpanel" id="if-studio" aria-labelledby="tab-if-studio" hidden>
  <p>This is how the framework is used.</p>
  <div class="if-studio" data-if-studio></div>
</div>

## Paper {#if-paper}

IrisFlow is described in the preprint below. I conceived and designed the study, developed the framework, implemented the code, ran the simulations and benchmarks, and wrote the manuscript; my co-authors fabricated the samples and supervised the project.

<div class="publications">
{% bibliography --group_by none --query @*[key=li2026irisflow]* %}
</div>

<script defer src="{{ '/assets/js/irisflow/irisflow.js' | relative_url | bust_file_cache }}"></script>
<script defer src="{{ '/assets/js/irisflow/live.js' | relative_url | bust_file_cache }}"></script>
<script defer src="{{ '/assets/js/irisflow/tabs.js' | relative_url | bust_file_cache }}"></script>
<script defer src="{{ '/assets/js/outline.js' | relative_url | bust_file_cache }}"></script>
