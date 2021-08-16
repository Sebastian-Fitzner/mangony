import * as fs from 'fs';
import React, { Fragment } from 'react';
import LytDefault from './lyt-default';

function withLayoutDocs(cmp) {
    return LytDefault(({ root, context }) => {
        const dirname = root.currentPage.dirname;
        const readme = fs.readFileSync(`${dirname}/README.md`, 'utf-8');

        return (
            <Fragment>
                <h1>Docs</h1>
                {readme}
                {
                    Object.values(context.variations).map((variation, idx) => {
                        return (
                            <div key={idx}>
                                { variation.variationName &&
                                    (<h2>Variation: {variation.variationName}</h2>)
                                }
                                { cmp({ ...variation.props}) }
                            </div>
                        )
                    })
                }
            </Fragment>
        )
    })
}

export default withLayoutDocs;
