import React from 'react';

const headerStyles = {
    borderBottom: '1px solid #ccc',
    marginBottom: '2rem',
    paddingBottom: '1rem'
};
const stageStyles = {
    backgroundColor: 'f3f3f3',
    height: '250px',
    margin: '1rem 0',
    padding: '1rem'
}
const footerStyles = {
    borderTop: '1px solid #ccc',
    marginTop: '2rem',
    paddingTop: '.5rem'
};

export default function LytDefault(cmp) {
    return (props) => {
        return (
            <html lang="en">
            <head>
                <meta charSet="UTF-8"/>
                <meta name="viewport"
                      content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"/>
                <meta httpEquiv="X-UA-Compatible" content="ie=edge"/>
                <title>Layouts with Mangony and React</title>
            </head>
            <body>
            <header style={headerStyles}>
                <h1>Mangony (P)React Renderer</h1>
            </header>
            <section style={stageStyles}>
                stage
            </section>
            <main id={'main'}>
                {cmp(props)}
            </main>
            <footer style={footerStyles}><h3>footer</h3></footer>
            </body>
            </html>
        )
    }
}
