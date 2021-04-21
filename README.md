# pathways

**TL;DR Version** An implementation of a modular gamified learning management
system that might seem familiar...

A long and winding road has led to this point.  For years, personally wanted to
implement a learning/training platform for our engineering team, covering both
the operational and development centered aspects of our company's product and
codebase.  Certainly, the existing process of writing detailed documentation was
not working, because people either weren't reading it or the information was
flowing in and out with minimal retention.  For it to really stick, it needed
a verification model (assessments) and there are standard LMS platforms
out there that could do that.  But, being developer-centric, ideally needed
some form of hands-on mechanism to actually make people work through exercises.
And even more ideally, using some aspect of gamification (because everyone 
likes swag and rewards).

Next in this arduous story comes a time when, at a certain user conference for
a partner company, their new training platform was announced.  It looked like
the answer to all of the above requirements and desires!  Only two questions
(from the writer's perspective): when will it be available for custom partner
content and how will it work for content publishing and custom hands-on
activities (the immediate answers were *soon* and *to be determined*).

Fast-forward two years of waiting (soon indeed!), custom content delivery
finally goes GA but is not partner-centric, costs $$$ and has no hands-on
ability (actually, the first release didn't even support custom content, only
the ability to link existing content together).  So, first question answered
(sort of, ok not really) but the second question (to make it hands-on and
really usable in custom application and development training)?  After lots of
badgering (another year or two), answer finally provided:

*We consider that our secret sauce and it will never be available/released...*

Soooo, back to the drawing board, after years lost waiting for the original
ideal, evaluating implementing engineering training with online LMS platforms
or products with the original goals in mind.  Main front-runner is Moodle, but
it (like others) has tons of extra features for running a full academic program
instead of just a self-directed learning environment.  And nothing is really a
good fit when it comes to trying to integrate in hands-on learning elements.

And then the light goes on - *are you a software developer or not*?
And pathways is born.  Yes, it looks like the other platform for end-user
familiarity.  No, it is not reverse engineered, it uses completely different
technology, formatting, styling etc. as well as supporting additional
capabilities and hands-on integration possibilities with arbitrary platforms.

## What This System Is

* a path/module/unit-based learning platform that directly supports quizzes,
  badges and points/gamification for technical training
* a framework/engine for integrating hands-on exercises into the learning
  content
* an open-source implementation of the above that you can deploy and customize
  to your liking, for whatever types of content you desire

## What This System Is Not

* an actual replacement of the 'other product' - it does not support
  multi-tenant content management and publishing, learning assignment/reporting,
  centralized authentication (must be externally provided), etc.
* a full learning content management engine with online publishing and revision
  tracking.  Instead it is very developer-centric, treating content like
  code that is managed through an external revision control system and must
  follow specific formatting rules
* a WYSIWYG editor/content authoring engine for learning material creation and
  management

# Setup and Configuration/Customization

As much as possible, this repository is laid out in accordance with the
recommended best-practices for PHP-based packages (the major difference is that
*assets* is used instead of *public*).  To 'install' the application, the
*assets* and *pages* directories should be accessible from the web server,
with the following mappings (in the following, *<root>* signifies the root
*host:port* of the pathways application URL):

* the 'static' content located in the *assets* directory (both content from the
  pathways application itself as well as the provided resources related to
  published content under the *modules* subdirectory) should be publicly
  exposed by the web server directly under the URI *<root>* (e.g.
  *<root>/images, *<root>/css*, etc.
* URI's of the form *<root>/<app>/<subpath>* should map to the
  corresponding *<app>.php* script under *pages* with the *<subpath>* being
  passed as PATH_INFO (watch for the various security settings related to this).
* For security, the *src* and *config* directories should be exposed to the PHP
  engine but not be accessible externally through the web server.  Especially
  the *config* directory which contains the database authentication information.

Here are the relevant details of configuring the above for an nginx server
instance (here pathways is located in the *html* server directory).

> location / {
>     root html/pathways/assets;
>     try_files $uri /pathways/pages$uri;
> }
>
> location ~ /pathways/pages/ {
>     internal;
>     root html;
> 
>     # Extract path, immediate exit for unmatched scripts
>     rewrite ^/pathways/pages/(\w+)(/.*)?$
>             /pathways/pages/$1.php$2 last;
>     try_files $fastcgi_script_name =404;
> 
>     # Pass to the PHP-FPM engine
>     include fastcgi_params;
>     fastcgi_pass unix:/var/run/php/php-fpm-pathways.sock;
>     fastcgi_split_path_info ^(.+\.php)(/.+)$;
>     fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
>     set $path_info $fastcgi_path_info;
>     fastcgi_param PATH_INFO $path_info;
> }

There is one resource that is not in the source tree (but may be published in
a release).  The *assets/js/pathways-bundle.js* file contains the compiled
React-based components that support the dynamic UI elements in the pathways
application.  If this file is missing, it can be regenerated from the
*src/react* subdirectory using the command *npm run prod* (or *npm run dev* for
development activities).  An *npm install* would be needed first to load the
required npm-sourced libraries needed for compilation.

The initial database DDL is contained in the *db* directory.  Currently
only PostgreSQL is defined but the underlying PHP uses PDO (and the data
model is not extravagantly complex) so a MySQL conversion is possible.  Deploy
that into the database instance accessible from the PHP scripts.  This needs to
be done manually, there is no automated database deployment mechanism.

Neither is there a guided configuration mechanism for the system as well.
Instead, edit the *config/pathways.ini* file and provide the relevant
information for accessing the database instance, as was used in creating the
database in the previous step.

As mentioned above, the current pathways implementation does not
provide any support for either user provisioning or user authentication.  The
database schema is provided to create the associated user records as used
and referenced by the pathways schema, but as part of the installation a
mechanism to create the user records will need to be provided.  In addition,
the code will need to be customized to add the process for identifying and
authenticating the user instance. By default, the pathways installation is
hard-coded to create a 'test' user and will authenticate to that user only.
The relevant changes for authentication will be required in the
*src/inc/init.inc* file to define the appropriate *$UserId*.  Might the
author suggest his *nginx-session* authentication extension?

Finally, the pathways program handles assessment points/scoring with the same
model as the 'other system'.  If you want a different calculation, modify
the *getPoints()* method in *src/lib/unit.php*.  Note that the assessment
verifier writes the calculated points on completion of a unit, so adjusting the
formula will only affect future unit assessments.

# Publishing

The content publishing method for pathways is to utilize XML files to define
the path, module and unit learning content.  In the *examples* directory are
two example content definitions that will do a much better job of illustrating
the formatting of content, including the definition of quiz assessments,
referential paths (signposts) and hands-on descriptions (see the next section
for information on handling those conditions).  Once a document is ready,
simply run

> php bin/publish.php <document.xml>

which will parse the document content, insert/update the database and push
static content like embedded images into the appropriate *assets* folder.
