---
layout: about
title: about
permalink: /
subtitle: <a href="https://www.xmu.edu.cn/">Xiamen University</a> · Generative modeling for inverse design

selected_papers: false # the IrisFlow paper is listed at the end of the IrisFlow section instead
social: false # the contact icons are rendered at the end of the page body instead, so the email link can be protected

announcements:
  enabled: false

latest_posts:
  enabled: false
---

<link rel="stylesheet" href="{{ '/assets/css/irisflow.css' | relative_url | bust_file_cache }}" />
<link rel="stylesheet" href="{{ '/assets/css/outline.css' | relative_url | bust_file_cache }}" />

I am a student in the Department of Electronic Engineering at Xiamen University. I build [**IrisFlow**](#irisflow), a generative model for the inverse design of optical multilayer structures. It is a practical inverse-design method: engineers in my lab already use it for their designs, and we are working to integrate it into design software. We have used it to solve several design cases without any traditional optimization; the results are in [our paper](#if-paper). I strongly believe it can make optical multilayer design much easier.

More broadly, I believe flow matching can drive inverse design and generation in other fields as well, especially problems where discrete and continuous variables are coupled.

<div class="if-home-head" id="irisflow">
  <span class="if-kicker">Main project</span>
  <h2 class="if-hero-title" data-toc="IrisFlow">IrisFlow <span class="if-hero-sub">inverse design of optical coatings where the design space is the input</span></h2>
  <p class="if-lead">
  <strong>IrisFlow</strong> is a generative model for the inverse design of multilayer optical coatings. You hand it a <em>design request</em>: the spectrum you want, the wavelength band you care about, the materials you can actually deposit, given only as their optical curves, and how many layers you allow. It generates a pool of candidate stacks from pure noise, denoising the discrete material choices and the continuous thicknesses together. Every candidate is re-simulated exactly, so you select by whatever rule matters to you and take the recipe to the deposition chamber.
  </p>
  <p class="if-links">
    <a class="if-btn" href="#if-map">What it can do</a>
    <a class="if-btn if-btn-ghost" href="#if-joint">Two flows, one network</a>
    <a class="if-btn if-btn-ghost" href="#if-inside">Data pipeline</a>
    <a class="if-btn if-btn-ghost" href="#if-studio">Design a coating</a>
    <a class="if-btn if-btn-ghost" href="#if-live">Try the model</a>
    <a class="if-btn if-btn-ghost" href="https://arxiv.org/abs/2607.08392">Paper</a>
  </p>
</div>

<h3 class="if-sec" id="if-map">What IrisFlow can do</h3>

One trained model, and what it gives a coating designer.

<div class="if-idea if-map" data-if-map></div>

<h3 class="if-sec" id="if-joint">How the two flows steer each other</h3>

A coating is a list of layers, each with a material and a thickness, and IrisFlow generates both at once: a continuous flow for the thicknesses and a discrete flow for the materials, under one shared clock. They are not two samplers running side by side. At every step one network reads each layer's thickness and material together, and what it predicts crosses over: thicknesses reshape the material probabilities, and materials move the predicted final thicknesses.

<div class="if-idea" data-if-idea="joint"></div>

<h3 class="if-sec" id="if-inside">What happens inside: the data pipeline</h3>

The mechanism in one picture, organised around the layer tokens in the middle.

<div class="if-pipeline" data-if-pipeline></div>

<h3 class="if-sec" id="if-studio">Design a coating in four steps</h3>

This is how the framework is used.

<div class="if-studio" data-if-studio></div>

<h3 class="if-sec" id="if-live">Try the real model</h3>

The panels above are illustrations. This one runs IrisFlow itself: your request goes to a [Hugging Face Space](https://huggingface.co/spaces/lz-1/IrisFlow), which borrows a GPU for a few seconds, generates several designs and re-simulates each one with the transfer-matrix method (normal incidence, from air onto a fused-silica substrate; layer 1 sits on the substrate). The materials that were never seen in training are given to the model only as their n,k curves. Hugging Face gives each anonymous visitor only a few GPU runs; after that, or when no GPU is free, the request runs on a CPU with at most 8 designs and takes longer. If nobody has used the Space for a while it sleeps, and the first request takes about a minute to wake it.

<div class="if-live" data-if-live="lz-1/IrisFlow" data-presets="{{ '/assets/json/irisflow-presets.json' | relative_url }}"></div>

<h3 class="if-sec" id="if-paper">Paper</h3>

IrisFlow is described in the preprint below. I conceived and designed the study, developed the framework, implemented the code, ran the simulations and benchmarks, and wrote the manuscript; my co-authors fabricated the samples and supervised the project.

<div class="publications">
{% bibliography --group_by none --query @*[key=li2026irisflow]* %}
</div>

{% comment %} This theme version prints the contact icons without passing them through al_email_protect, which leaves a
plain mailto: link in the page. Render them here with the filter so the address never appears whole in the HTML. The
title is moved out of the way first because the filter would otherwise fold it into the class attribute. {% endcomment %}
{% capture contact_icons %}{% social_links %}{% endcapture %}
<div class="social">
  <div class="contact-icons">{{ contact_icons | replace: " title='Email'", "" | replace: ' title="Email"', '' | al_email_protect_html | replace: 'class="al-email-protect', 'title="Email" class="al-email-protect' }}</div>
  <div class="contact-note">{{ site.contact_note }}</div>
</div>

<script defer src="{{ '/assets/js/irisflow/irisflow.js' | relative_url | bust_file_cache }}"></script>
<script defer src="{{ '/assets/js/irisflow/live.js' | relative_url | bust_file_cache }}"></script>
<script defer src="{{ '/assets/js/outline.js' | relative_url | bust_file_cache }}"></script>
