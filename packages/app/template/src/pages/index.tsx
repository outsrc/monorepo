import * as React from 'react'
import { NextPage } from 'next'
import { Button } from 'components/Button'

const Index: NextPage = () => {
  const handleClick = () => {
    alert('World')
  }

  return (
    <div>
      <Button label='Hello template' onClick={handleClick} />
    </div>
  )
}

export default Index

