import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';

const NavbarComponent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleNavClick = (path) => {
    navigate(path);
  };

  return (
    <Navbar expand="lg" className="navbar-soono" fixed="top">
      <Container>
        <Navbar.Brand 
          style={{ cursor: 'pointer' }}
          onClick={() => handleNavClick('/')}
        >
          🧶 Sóonó | macramê & crochê
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link 
              className={isActive('/') ? 'active' : ''}
              onClick={() => handleNavClick('/')}
            >
              📊 Dashboard
            </Nav.Link>
            
            <Nav.Link 
              className={isActive('/insumos') ? 'active' : ''}
              onClick={() => handleNavClick('/insumos')}
            >
              🧵 Insumos
            </Nav.Link>
            
            <Nav.Link 
              className={isActive('/produtos') ? 'active' : ''}
              onClick={() => handleNavClick('/produtos')}
            >
              🎨 Produtos
            </Nav.Link>
            
            <Nav.Link 
              className={isActive('/vendas') ? 'active' : ''}
              onClick={() => handleNavClick('/vendas')}
            >
              💰 Vendas
            </Nav.Link>
            
            <Nav.Link 
              className={isActive('/estatisticas') ? 'active' : ''}
              onClick={() => handleNavClick('/estatisticas')}
            >
              📈 Estatísticas
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;