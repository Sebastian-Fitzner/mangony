import React from 'react';
import Test from '../partials/test';

function Home() {
    return (
        <div className='test'>
            Home Page is working ...
            <Test
                text={'... with some text'}
                src={'https://www.seekpng.com/png/detail/263-2630215_web-design-programming-courses-in-london-java.png'} />
        </div>
    )
}

export default Home;
