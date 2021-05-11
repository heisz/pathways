/*
 * React component for search encapsulation (no state whatsoever)...
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */
import React from 'react';

/* Inbound properties from the page */
interface SearchProps {
    searchQuery: string;
    placeholder: string;
}

/* Should we actually encounter any, search state can go in here */
interface SearchState {
}

/* React component to encapsulate scrollspy for unit sections */
class Search extends React.Component<SearchProps, SearchState> {
    /* This is awkward but need constructor for binding */
    constructor(props: SearchProps) {
        super(props);
    }

    /* Standard React method to render state-driven component content */
    render(): any {
        return (
          <span className="search-wrapper">
            <span className="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0V0z" fill="none"/>
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5
                         16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5
                         16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49
                         19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5
                         14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </span>
            <input className="search-input" type="search" size={60}
                   placeholder={ this.props.placeholder }
                   defaultValue={ this.props.searchQuery }
                   onKeyDown={ (ev: React.KeyboardEvent<HTMLInputElement>) => {
                       if (ev.keyCode == 13) {
                           window.location.href =
                              '/search?srch_qry=' + (ev.target as any).value;
                       }
                   } }/>
          </span>
        );
    }
}

export default Search;
