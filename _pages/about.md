---
layout: about
title: about
permalink: /
subtitle: <a href="https://www.xmu.edu.cn/">Xiamen University</a> · Generative modeling for inverse design

selected_papers: false # the paper is listed under Publications below
social: false # the contact links are written in the page body instead, so the email link can be protected

announcements:
  enabled: false

latest_posts:
  enabled: false
---

{% comment %} This theme version does not pass contact links through al_email_protect, so the email link is written
here and filtered: the address never appears whole in the HTML and there is no mailto: link. {% endcomment %}
{% capture contact_links %}

<ul class="site-links">
  <li><a href="mailto:{{ site.data.socials.email }}"><i class="fa-solid fa-envelope"></i>Email</a></li>
  <li><a href="https://github.com/{{ site.data.socials.github_username }}"><i class="fa-brands fa-github"></i>GitHub</a></li>
  <li><a href="https://arxiv.org/abs/2607.08392"><i class="fa-regular fa-file-lines"></i>IrisFlow paper</a></li>
  <li><a href="{{ '/irisflow/#if-live' | relative_url }}"><i class="fa-solid fa-play"></i>Live demo</a></li>
</ul>
{% endcapture %}
{{ contact_links | al_email_protect_html }}

I am a student in the Department of Electronic Engineering at Xiamen University. I build [**IrisFlow**]({{ '/irisflow/' | relative_url }}), a generative model for the inverse design of optical multilayer structures. It is a practical inverse-design method: engineers in my lab already use it for their designs, and we are working to integrate it into design software. We have used it to solve several design cases without any traditional optimization; the results are in [our paper](#publications). I strongly believe it can make optical multilayer design much easier.

More broadly, I believe flow matching can drive inverse design and generation in other fields as well, especially problems where discrete and continuous variables are coupled.

## Research

<div class="site-feature">
  <a class="site-feature-media" href="{{ '/irisflow/' | relative_url }}" aria-hidden="true" tabindex="-1">
    <img src="{{ '/assets/img/irisflow/card-example.png' | relative_url }}" alt="" loading="lazy" />
  </a>
  <div class="site-feature-body">
    <h3><a href="{{ '/irisflow/' | relative_url }}">IrisFlow</a></h3>
    <p class="site-feature-sub">Inverse design of multilayer optical coatings, with the design space as the input</p>
    <p>You give IrisFlow the spectrum you want, the wavelength band, the materials you can deposit (only as their optical curves) and a layer count. It generates candidate coatings from noise, choosing the materials and the thicknesses together, and every candidate is re-simulated exactly.</p>
    <div class="site-actions">
      <a class="site-btn" href="{{ '/irisflow/#if-live' | relative_url }}">Try the model</a>
      <a class="site-arrow" href="{{ '/irisflow/' | relative_url }}">How it works</a>
    </div>
  </div>
</div>

<div class="site-item">
  <h3><a href="{{ '/projects/fp-acoustic/' | relative_url }}">Fiber-optic Fabry–Pérot acoustic sensing</a></h3>
  <p class="site-note">Earlier work on digital signal demodulation for a fiber-optic Fabry–Pérot acoustic sensor. A first-author manuscript is under review.</p>
</div>

## Publications

<div class="publications">
{% bibliography --group_by none --query @*[key=li2026irisflow]* %}
</div>

## Contact

{% capture contact_line %}<p>{{ site.contact_note | strip }} <a href="mailto:{{ site.data.socials.email }}">Write to me</a>.</p>{% endcapture %}
{{ contact_line | al_email_protect_html }}

<script>
  /* The IrisFlow sections moved to /irisflow/; keep old links such as /#if-live working. */
  (function () {
    var h = location.hash;
    if (/^#(irisflow$|if-|pipe=|joint=|map=|studio-demo=)/.test(h)) location.replace("{{ '/irisflow/' | relative_url }}" + (h === "#irisflow" ? "" : h));
  })();
</script>
