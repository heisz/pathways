--
-- Database definition file for the pathways database in PostgreSQL
--
-- Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
-- See the LICENSE file accompanying the distribution your rights to use
-- this software.
--
-- To load, recommended command is:
--
-- psql -U <userid> -W <database> < pathways.pgsql
--
-- NOTE: ordering on these drop statements must take into consideration the
--       foreign key constraints (or relax foreign key constraints).
--

DROP TABLE IF EXISTS pathways.assessments;
DROP TABLE IF EXISTS pathways.badges;
DROP TABLE IF EXISTS pathways.users;
DROP TABLE IF EXISTS pathways.answers;
DROP TABLE IF EXISTS pathways.questions;
DROP TABLE IF EXISTS pathways.units;
DROP TYPE IF EXISTS pathways.assesstype;
DROP TABLE IF EXISTS pathways.signposts;
DROP TABLE IF EXISTS pathways.paths;
DROP TABLE IF EXISTS pathways.modules;

-- Note, no cascade, just in case someone added an extension...
DROP SCHEMA IF EXISTS pathways;

------------------------------------------------------------------

CREATE SCHEMA pathways;

-- Root of it all, modules that are available for learning!
CREATE TABLE pathways.modules (
    module_id VARCHAR(64) NOT NULL,
    icon VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    synopsis TEXT NOT NULL,
    in_preview BOOLEAN NOT NULL DEFAULT 'y',
    est_time INT NOT NULL,
    points INT NOT NULL,
    last_update TIMESTAMP NOT NULL,

    PRIMARY KEY (module_id)
);

-- Paths are collection of references to module sets (signposts)
CREATE TABLE pathways.paths (
    path_id VARCHAR(64) NOT NULL,
    icon VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    synopsis TEXT NOT NULL,
    in_preview BOOLEAN NOT NULL DEFAULT 'y',

    PRIMARY KEY (path_id)
);

CREATE TABLE pathways.signposts (
    path_id VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    synopsis TEXT NOT NULL,

    PRIMARY KEY (path_id)
);

CREATE TYPE pathways.assesstype AS ENUM ('quiz', 'lab');

-- Each module is made up of a set of units
CREATE TABLE pathways.units (
    module_id VARCHAR(64) NOT NULL,
    unit_id VARCHAR(64) NOT NULL,
    ordr INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    synopsis TEXT NOT NULL,
    est_time INT NOT NULL,
    content TEXT NOT NULL,
    assess_type PATHWAYS.ASSESSTYPE NOT NULL,
    points INT NOT NULL,

    -- Defined for lab units only
    setup TEXT NULL,
    activity TEXT NULL,

    PRIMARY KEY (module_id, unit_id),
    UNIQUE (module_id, unit_id, ordr),
    FOREIGN KEY (module_id) REFERENCES pathways.modules(module_id)
);

-- For quizzed units, the associated questions (not for hands-on)
CREATE TABLE pathways.questions (
    module_id VARCHAR(64) NOT NULL,
    unit_id VARCHAR(64) NOT NULL,
    question_id VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,

    PRIMARY KEY (module_id, unit_id, question_id),
    FOREIGN KEY (module_id, unit_id)
        REFERENCES pathways.units(module_id, unit_id)
);

-- And answers
CREATE TABLE pathways.answers (
    module_id VARCHAR(64) NOT NULL,
    unit_id VARCHAR(64) NOT NULL,
    question_id VARCHAR(64) NOT NULL,
    answer_id VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT 'n',

    PRIMARY KEY (module_id, unit_id, question_id, answer_id),
    FOREIGN KEY (module_id, unit_id, question_id)
        REFERENCES pathways.questions(module_id, unit_id, question_id)
        ON DELETE CASCADE
);

-- Standard user table for tracking progress (must link to external auth)
CREATE TABLE pathways.users (
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    can_preview BOOLEAN NOT NULL DEFAULT 'n',
    badge_count INT NOT NULL DEFAULT 0,
    total_points INT NOT NULL DEFAULT 0,

    PRIMARY KEY (user_id)
);

-- Entries written here on completion of modules
CREATE TABLE pathways.badges (
    user_id VARCHAR(255) NOT NULL,
    module_id VARCHAR(64) NOT NULL,
    points INT NOT NULL,
    completed TIMESTAMP NULL,

    PRIMARY KEY (user_id, module_id),
    FOREIGN KEY (user_id) REFERENCES pathways.users(user_id),
    FOREIGN KEY (module_id) REFERENCES pathways.modules(module_id)
);

-- Track in-progress and completed unit assessments
CREATE TABLE pathways.assessments (
    user_id VARCHAR(255) NOT NULL,
    module_id VARCHAR(64) NOT NULL,
    unit_id VARCHAR(64) NOT NULL,
    failures INT NOT NULL,
    points INT NOT NULL,
    completed TIMESTAMP NULL,

    PRIMARY KEY (user_id, module_id, unit_id),
    FOREIGN KEY (user_id) REFERENCES pathways.users(user_id),
    FOREIGN KEY (module_id, unit_id)
        REFERENCES pathways.units(module_id, unit_id)
);

-- For default installation, create a test user (coded into init.inc)
INSERT INTO pathways.users (user_id, user_name, can_preview)
    VALUES('test', 'Test User', 'y');
